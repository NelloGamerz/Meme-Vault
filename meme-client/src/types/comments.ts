export interface Comment {
    id: string
    username: string
    text: string
    createdAt: Date
  }
  
  export interface MemeComment {
    id: string
    memeId: string
    username: string
    text: string
    createdAt: Date
  }