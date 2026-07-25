import axios from 'axios'
import crypto from 'crypto'

const ENDPOINT = 'https://gql.tokopedia.com/graphql/SearchProductV5Query'

const QUERY = `
query SearchProductV5Query($params: String!) {
  searchProductV5(params: $params) {
    header {
      totalData
      responseCode
      isQuerySafe
      additionalParams
    }
    data {
      totalDataText
      products {
        oldID: id
        id: id_str_auto_
        ttsProductID
        name
        url
        applink
        mediaURL {
          image
          image300
          videoCustom
        }
        shop {
          oldID: id
          id: id_str_auto_
          ttsSellerID
          name
          url
          city
          tier
        }
        stock {
          ttsSKUID
        }
        badge {
          oldID: id
          id: id_str_auto_
          title
          url
        }
        price {
          text
          number
          range
          original
          discountPercentage
        }
        labelGroups {
          position
          title
          type
          url
        }
        category {
          oldID: id
          id: id_str_auto_
          name
          breadcrumb
          gaKey
        }
        rating
        wishlist
        ads {
          id
          productClickURL
          productViewURL
          productWishlistURL
          tag
        }
      }
    }
  }
}
`

function buildParams(keyword, page, rows) {
  const uniqueId = crypto.randomBytes(16).toString('hex')
  return new URLSearchParams({
    device: 'desktop',
    enter_method: 'normal_search',
    l_name: 'sre',
    navsource: 'home',
    ob: '23',
    page: String(page),
    q: keyword,
    related: 'true',
    rows: String(rows),
    safe_search: 'false',
    sc: '',
    scheme: 'https',
    shipping: '',
    show_adult: 'false',
    source: 'universe',
    st: 'product',
    start: String((page - 1) * rows),
    topads_bucket: 'true',
    unique_id: uniqueId,
    user_addressId: '',
    user_cityId: '176',
    user_districtId: '2274',
    user_id: '',
    user_lat: '',
    user_long: '',
    user_postCode: '',
    user_warehouseId: '',
    variants: '',
    warehouses: '',
  }).toString()
}

function cleanProduct(p) {
  return {
    id: p?.id || null,
    name: p?.name || '',
    url: p?.url || '',
    image: p?.mediaURL?.image300 || p?.mediaURL?.image || '',
    price: p?.price?.text || '',
    originalPrice: p?.price?.original || '',
    discountPercent: p?.price?.discountPercentage || 0,
    rating: p?.rating || 0,
    sold: p?.labelGroups?.find(v => v.position === 'ri_product_credibility')?.title || '',
    shopName: p?.shop?.name || '',
    shopCity: p?.shop?.city || '',
    shopTier: p?.shop?.tier || '',
    category: p?.category?.name || '',
  }
}

export async function searchTokopedia(keyword, options = {}) {
  const {
    page = 1,
    rows = 10,
    limit = 5,
    timeout = 15000,
  } = options

  const deviceId = String(Math.floor(7000000000000000000 + Math.random() * 999999999999999999))

  const payload = [
    {
      operationName: 'SearchProductV5Query',
      variables: {
        params: buildParams(keyword, page, rows),
      },
      query: QUERY,
    },
  ]

  const res = await axios.post(ENDPOINT, payload, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json',
      origin: 'https://www.tokopedia.com',
      referer: 'https://www.tokopedia.com/',
      'x-tkpd-lite-service': 'zeus',
      'x-price-center': 'true',
      'bd-device-id': deviceId,
      'bd-web-id': deviceId,
      'x-version': 'bab78f7',
      'x-device': 'desktop-0.0',
      'x-dark-mode': 'false',
      'x-source': 'tokopedia-lite',
      'tkpd-userid': '',
      'iris_session_id': '',
    },
    timeout,
  })

  const root = Array.isArray(res.data) ? res.data[0] : res.data
  const products = root?.data?.searchProductV5?.data?.products || []
  const total = root?.data?.searchProductV5?.header?.totalData || 0

  const items = products.slice(0, limit).map(cleanProduct)

  return { items, total, keyword }
}