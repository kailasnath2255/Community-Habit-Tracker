'use server';

import { createClient, createServiceClient } from '@/lib/supabase-server';

/**
 * Upload completion image to Supabase Storage
 * Converts base64 data URL to file and uploads to community-images bucket
 */
export async function uploadCompletionImage(
  habitLogId: string,
  imageData: string,
  userId: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!imageData || !imageData.startsWith('data:')) {
      return { success: false, error: 'Invalid image data format' };
    }

    const supabase = createClient();

    // Verify user owns this habit log
    const { data: habitLog, error: logError } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('id', habitLogId)
      .single() as any;

    if (logError || !habitLog) {
      console.error('Habit log error:', logError);
      return { success: false, error: 'Habit log not found' };
    }

    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id')
      .eq('id', (habitLog as any).habit_id)
      .eq('user_id', userId)
      .single() as any;

    if (habitError || !habit) {
      console.error('Habit error:', habitError);
      return { success: false, error: 'Unauthorized - you do not own this habit' };
    }

    // Convert data URL to blob/buffer
    const base64Match = imageData.match(/data:image\/(\w+);base64,(.+)/);
    if (!base64Match) {
      return { success: false, error: 'Invalid image format' };
    }

    const [, imageType, base64Data] = base64Match;
    const binaryData = Buffer.from(base64Data, 'base64');

    // Generate unique filename with proper extension
    const timestamp = Date.now();
    const fileName = `${userId}/${habitLogId}/${timestamp}.${imageType === 'jpeg' ? 'jpg' : imageType}`;

    console.log('Uploading to storage:', { fileName, dataLength: binaryData.length });

    // Upload to Supabase Storage
    const { data: uploadedData, error: uploadError } = await supabase.storage
      .from('completion-images')
      .upload(fileName, binaryData, {
        contentType: `image/${imageType}`,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    console.log('Upload successful:', uploadedData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('completion-images')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Failed to generate public URL' };
    }

    const imageUrl = urlData.publicUrl;
    console.log('Public URL:', imageUrl);

    // Save image URL to database using service role client (bypasses RLS)
    try {
      const serviceClient = createServiceClient();

      // First, delete any existing image for this habit_log
      await serviceClient
        .from('completion_images')
        .delete()
        .eq('habit_log_id', habitLogId);

      // Then insert the new image
      const { error: insertError } = await serviceClient
        .from('completion_images')
        .insert([
          {
            habit_log_id: habitLogId,
            image_url: imageUrl,
          },
        ] as any);

      if (insertError) {
        console.error('Insert error:', insertError);
        return { 
          success: false, 
          error: `Failed to save image: ${insertError.message}` 
        };
      }
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return { 
        success: false, 
        error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown'}` 
      };
    }

    return { success: true, imageUrl };
  } catch (error) {
    console.error('Error uploading image:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to upload image';
    return {
      success: false,
      error: `${errorMsg}. Check browser console for details.`,
    };
  }
}

/**
 * Delete completion image from storage
 */
export async function deleteCompletionImageFromStorage(
  habitLogId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = createClient();

    // Verify ownership
    const { data: habitLog, error: logError } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('id', habitLogId)
      .single() as any;

    if (logError || !habitLog) {
      return { success: false, error: 'Habit log not found' };
    }

    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id')
      .eq('id', (habitLog as any).habit_id)
      .eq('user_id', userId)
      .single() as any;

    if (habitError || !habit) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get image URL from database
    const { data: image } = await supabase
      .from('completion_images')
      .select('image_url')
      .eq('habit_log_id', habitLogId)
      .single() as any;

    if ((image as any)?.image_url) {
      // Extract file path from URL
      const urlParts = (image as any).image_url.split('/storage/v1/object/public/completion-images/');
      if (urlParts[1]) {
        // Delete from storage
        await supabase.storage
          .from('completion-images')
          .remove([urlParts[1]]);
      }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('completion_images')
      .delete()
      .eq('habit_log_id', habitLogId);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image',
    };
  }
}
