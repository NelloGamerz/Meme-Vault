import type { Meme, ApiMeme } from "../types/mems";

/**
 * Maps an API meme object to the client-side Meme format
 * @param apiMeme The API meme object to map
 * @param includeComments Whether to include comments in the mapped object (default: false)
 */
export const mapApiMemeToMeme = (apiMeme: ApiMeme, includeComments: boolean = false): Meme => ({
  id: apiMeme.id,
  url: apiMeme.mediaUrl,
  title: apiMeme.caption,
  uploadedBy: apiMeme.uploadedby,
  uploadDate: new Date(),
  comments: includeComments ? (apiMeme.comments || []) : [],
  likeCount: apiMeme.likecount,
  saveCount: apiMeme.saveCount,
  uploader: apiMeme.uploader,
  commentsCount: apiMeme.commentsCount,
  memeCreated: apiMeme.memeCreated,
  profilePictureUrl: apiMeme.profilePictureUrl,
  userId: apiMeme.userId,
});