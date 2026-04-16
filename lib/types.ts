export interface Forum {
  id: string
  title: string
  course: string
  total_posts: number | null
  description: string | null
  reference_summary: string | null
  created_at: string
}

export interface Annotation {
  id: string
  forum_id: string
  user_id: string
  text: string
  created_at: string
  updated_at: string
}

export interface ForumWithAnnotation extends Forum {
  annotation: Annotation | null
}
