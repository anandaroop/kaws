import slugify from "slugify"
import { Collection, Subcollection } from "../Entities"

export const sanitizeRow = ({
  title,
  slug,
  category,
  description,
  headerImage,
  credit,
  artist_ids,
  gene_ids,
  tag_id,
  keyword,
  price_guidance,
  show_on_editorial,
  is_featured_artist_content,
  artist_series,
  featured_collections,
  other_collections,
}) => {
  return {
    title,
    slug: sanitizeSlug(slug),
    category,
    description,
    headerImage,
    credit,
    price_guidance: price_guidance ? Number(price_guidance) : null,
    show_on_editorial: Boolean(show_on_editorial),
    is_featured_artist_content: Boolean(is_featured_artist_content),
    subcollections: build_subcollections(
      artist_series,
      featured_collections,
      other_collections
    ),
    query: (artist_ids || gene_ids || tag_id || keyword) && {
      artist_ids: splitmap(artist_ids),
      gene_ids: splitmap(gene_ids),
      tag_id,
      keyword,
    },
  } as Collection
}

const splitmap = text => (text ? text.split(",").map(a => a.trim()) : [])

const build_subcollections = (
  artist: string,
  featured: string,
  other: string
) => {
  const output: Subcollection[] = []
  if (artist && artist.length > 0) {
    output.push({ name: "Artist Series", members: splitmap(artist) })
  }
  if (featured && featured.length > 0) {
    output.push({ name: "Featured Collections", members: splitmap(featured) })
  }
  if (other && other.length > 0) {
    output.push({ name: "Other Collections", members: splitmap(other) })
  }
  return output
}

export const sanitizeSlug = (slug: string) => {
  const cleanedSlug = slugify(slug, {
    remove: /[.'",&:\/#!$%\^\*;{}=_`’~()]/g,
    lower: true,
  })

  return cleanedSlug
}
