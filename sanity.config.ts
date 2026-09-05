'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\src\app\studio\[[...tool]]\page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'
import {ApproveCreatorAction, RejectCreatorAction, ResendApprovalEmailAction} from './src/sanity/actions/creatorActions'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema: {
    types: schema.types,
    // Lets the "Gift Boxes" pane create products with isGift already on, so a
    // new gift doesn't vanish from the pane the moment it is saved.
    templates: (prev) => [
      ...prev,
      {
        id: 'product-gift',
        title: 'Gift Box',
        schemaType: 'product',
        value: {isGift: true},
      },
    ],
  },
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
  document: {
    actions: (prev, context) =>
      context.schemaType === 'creatorApplication'
        ? [ApproveCreatorAction, RejectCreatorAction, ResendApprovalEmailAction, ...prev]
        : prev,
  },
})
