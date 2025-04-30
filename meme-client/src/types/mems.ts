export interface User{
  userId: string,
  username?: string,
  profilePictureUrl: string,
  memeList: Meme[]
  likedMeme: Meme[],
  savedMeme: Meme[],
  userCreated : Date,
  following: Following[],
  followers: Followers[],
  followersCount: number,
  followingCount: number,
}

export interface UserApi{
  userId: string,
  username: string,
  profilePictureUrl: string,
  memeList: Meme[]
  likedMeme: Meme[],
  savedMeme: Meme[],
  userCreated : Date,
  following: Following[],
  followers: Followers[],
  followersCount: number,
  followingCount: number,
}

export interface Meme {
  id: string;
  url: string;
  title: string;
  uploadedBy?: string;
  uploadDate?: Date;
  memeCreated?: Date;
  comments: Comment[];
  likeCount: number;
  saveCount: number;
  uploader: string;
  profilePictureUrl: string;
  userId: string;
}

export interface Comment {
  id?: string;
  memeId: string;
  userId: string;
  text: string;
  username: string;
  createdAt: Date;
  profilePictureUrl: string;
}

export interface ApiMeme {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string;
  uploadedby: string;
  memeCreated?: Date;
  createdAt?: Date;
  comments?: Comment[];
  likecount: number;
  saveCount: number;
  uploader: string;
  profilePictureUrl: string;
  userId: string,
}

export interface ApiComment {
  id?: string;
  userId: string;
  memeId: string;
  text: string;
  username: string;
  createdAt: string;
}

export interface ApiLike {
  memeId: string;
  userId: string;
}

export interface ApiSave {
  memeId: string;
  userId: string;
}


export interface ApiFollowers{
  userId : string;
  username: string;
  profilePictureUrl: string;
  isFollow: boolean;
}

export interface ApiFollowing{
  userId : string;
  username: string;
  profilePictureUrl: string;
  isFollow: boolean;
}

export interface Followers{
  userId: string;
  username: string;
  profilePictureUrl: string;
  isFollow: boolean;
}

export interface Following{
  userId: string;
  username: string;
  profilePictureUrl: string;
  isFollow: boolean;
}