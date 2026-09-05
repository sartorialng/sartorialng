import type {StructureResolver} from 'sanity/structure'
import {Gift, ShoppingCart} from 'lucide-react'
import {apiVersion} from './env'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
//
// Gift boxes are ordinary `product` documents with `isGift == true`. They get
// their own pane so the client manages them separately from the bags.
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .id('products')
        .title('Products')
        .icon(ShoppingCart)
        .child(
          S.documentList()
            .title('Products')
            .apiVersion(apiVersion)
            .filter('_type == "product" && isGift != true')
            .defaultOrdering([{field: '_createdAt', direction: 'desc'}]),
        ),
      S.listItem()
        .id('giftBoxes')
        .title('Gift Boxes')
        .icon(Gift)
        .child(
          S.documentList()
            .title('Gift Boxes')
            .apiVersion(apiVersion)
            .filter('_type == "product" && isGift == true')
            .defaultOrdering([{field: '_createdAt', direction: 'desc'}])
            .initialValueTemplates([S.initialValueTemplateItem('product-gift')]),
        ),
      S.divider(),
      ...S.documentTypeListItems().filter((item) => item.getId() !== 'product'),
    ])
