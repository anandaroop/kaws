import { reduce } from "lodash"
import metaphysics from "../lib/metaphysics"
const currency = require("currency.js")

const formatCurrency = value => currency(value, { separator: "" }).format()

export const getPriceGuidance = async (slug: string) => {
  const results: any = await metaphysics(`{
    marketingCollection(slug: "${slug}") {
      artworks(
        size: 5,
        sort: "prices",
        price_range: "10-*"
      ) { 
        hits {
          price
        }
      }
    }
  }`)
  let avgPrice
  let hasNoBasePrice
  try {
    hasNoBasePrice =
      !results.marketingCollection ||
      results.marketingCollection.artworks.hits.length !== 5

    if (hasNoBasePrice) {
      avgPrice = null
    } else {
      avgPrice =
        reduce(
          results.marketingCollection.artworks.hits,
          (sum, { price }) => {
            return sum + parseInt(formatCurrency(price), 10)
          },
          0
        ) / results.marketingCollection.artworks.hits.length
    }
  } catch (error) {
    throw error
  }

  return hasNoBasePrice ? avgPrice : Math.ceil(avgPrice / 10) * 10
}
