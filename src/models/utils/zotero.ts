interface ItemInfo {
  id: number
  type: Zotero.Item.ItemType
  title?: string
  authors?: string
  year?: number
  abstract?: string
}

interface AttachmentInfo {
  id: number
  type:
    | 'attachment-pdf'
    | 'attachment-pdf-link'
    | 'attachment-file'
    | 'attachment-link'
    | 'attachment-snapshot'
    | 'attachment-web-link'
    | undefined
}

export async function getItemAndBestAttachment(id: number, mode: 'search' | 'qa' | 'citation') {
  const item = await Zotero.Items.getAsync(id)
  let itemInfo: ItemInfo = { id: item.id, type: item.itemType }
  if (mode !== 'citation') {
    const title = item.getDisplayTitle()
    const creators = item.getCreators()
    const authors =
      creators.length === 0
        ? undefined
        : creators.length > 1
        ? `${creators[0].lastName} et al.`
        : `${creators[0].firstName} ${creators[0].lastName}`
    const year = new Date(item.getField('date') as string).getFullYear()
    itemInfo = { ...itemInfo, title, authors, year }
  }
  if (mode === 'qa') {
    const abstract = (item.getField('abstractNote', false, true) as string) || ''
    itemInfo = { ...itemInfo, abstract }
    return { item: itemInfo }
  }

  const attachment = await item.getBestAttachment()
  // Ref: https://github.com/zotero/zotero/blob/17daf9fe8dc792b1554a2a17e153fb90290617b3/chrome/content/zotero/itemTree.jsx#L3777
  if (!attachment) {
    return { item: itemInfo }
  }
  let attachmentInfo: AttachmentInfo = { id: attachment.id, type: undefined }
  const linkMode = attachment.attachmentLinkMode
  if (attachment.attachmentContentType === 'application/pdf' && attachment.isFileAttachment()) {
    if (linkMode === Zotero.Attachments.LINK_MODE_LINKED_FILE) {
      attachmentInfo.type = 'attachment-pdf-link' as const
    } else {
      attachmentInfo.type = 'attachment-pdf' as const
    }
  } else if (linkMode == Zotero.Attachments.LINK_MODE_IMPORTED_FILE) {
    attachmentInfo.type = 'attachment-file' as const
  } else if (linkMode == Zotero.Attachments.LINK_MODE_LINKED_FILE) {
    attachmentInfo.type = 'attachment-link' as const
  } else if (linkMode == Zotero.Attachments.LINK_MODE_IMPORTED_URL) {
    attachmentInfo.type = 'attachment-snapshot' as const
  } else if (linkMode == Zotero.Attachments.LINK_MODE_LINKED_URL) {
    attachmentInfo.type = 'attachment-web-link' as const
  }
  return { item: itemInfo, attachment: attachmentInfo }
}
