import { extractTags, resolveAddress } from '../../addresses'
import {
  assetIconHTML,
  formatAssetAmount,
  formatLocalAndUTC,
  formatNetworkWithIconHTML,
  formatUnknownAssetAmount,
  loadResources,
} from '../../common'
import {
  createCopyLinkHTML,
  installCopyEventListener,
} from '../../components/copy-link'
import {
  getExplorerAddressLink,
  getExplorerBlockLink,
  getExplorerTxLink,
} from '../../links'
import { getTransferById } from '../api'
import { getTypeDescription, getTypeLabel } from '../search'

function asPositionSuffix(pos) {
  return pos != null ? `-${pos}` : ''
}

function formatAsset(transfer) {
  const assetAmount = transfer.decimals
    ? formatAssetAmount(transfer)
    : formatUnknownAssetAmount(transfer)
  return `<div class="flex items-center gap-2 text-white/90">${assetIconHTML(transfer)}${assetAmount}</div>`
}

function formatTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return ''

  return `
    <div class="flex flex-wrap gap-1">
      ${tags
        .map((tag) => {
          const [key, value] = tag.split(':')
          const v = value ?? key

          return `
            <span
              class="inline-flex truncate items-center rounded-md border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400 max-w-xs"
              title="${tag}"
            >
              <span class="truncate">${v}</span>
            </span>
          `
        })
        .join('')}
    </div>
  `
}

function createTransferSummary(transfer) {
  const fromAddress = resolveAddress({
    address: transfer.from,
    formatted: transfer.fromFormatted,
    shorten: false,
  })
  const fromTags = formatTags(extractTags(transfer.display?.from))
  const toAddress = resolveAddress({
    address: transfer.to,
    formatted: transfer.toFormatted,
    shorten: false,
  })
  const toTags = formatTags(extractTags(transfer.display?.to))

  const summary = document.createElement('div')
  summary.id = 'transfer-summary'
  summary.className = 'bg-white/5 rounded-xl p-4 space-y-2'

  summary.innerHTML = `
    <div class="flex flex-col space-y-3 md:space-y-0 md:grid md:grid-cols-[auto_1fr] md:gap-4 text-sm text-white/90 text-mono pt-2">
      <div class="text-white/50 w-[6rem]">Network</div>
      ${formatNetworkWithIconHTML(transfer.network)}

      <div class="text-white/50 w-[6rem]">From</div>
      <div class="flex flex-col gap-y-1">
        ${createCopyLinkHTML({
          text: transfer.fromFormatted ?? transfer.from,
          display: fromAddress,
          url: getExplorerAddressLink(
            transfer.network,
            transfer.from,
            transfer.fromFormatted
          ),
          copyTextClasses: 'md:max-w-[40rem]',
        })}
        ${fromTags}
      </div>

      <div class="text-white/50 w-[6rem]">To</div>
      <div class="flex flex-col gap-y-1">
        ${createCopyLinkHTML({
          text: transfer.toFormatted ?? transfer.to,
          display: toAddress,
          url: getExplorerAddressLink(
            transfer.network,
            transfer.to,
            transfer.toFormatted
          ),
          copyTextClasses: 'md:max-w-[40rem]',
        })}
        ${toTags}
      </div>

      <div class="text-white/50 text-sm w-[6rem]">Asset</div>
      ${formatAsset(transfer)}
    </div>

`
  return summary
}

function createEventMetaHTML({
  eventModule,
  eventName,
  eventIndex,
  blockNumber,
}) {
  return eventModule
    ? `
      <div class="text-white/50 w-[6rem]">Event</div>
      <div class="flex flex-col space-y-1">
        <span title="${eventModule}.${eventName}" class="font-medium truncate">${eventModule}.${eventName}</span>
        <span class="text-white/90">${blockNumber}${asPositionSuffix(eventIndex)}</span>
      </div>
    `
    : ''
}

function createTxMetaHTML({ txModule, txMethod, txIndex, blockNumber }) {
  const hasModule = txModule && txMethod
  return hasModule
    ? `
        <div class="text-white/50 w-[6rem]">Extrinsic</div>
        <div class="flex flex-col space-y-1">
          <span title="${txModule}.${txMethod}" class="font-medium text-white/90 truncate">${txModule}.${txMethod}</span>
          <span class="text-white/90">${blockNumber}${asPositionSuffix(txIndex)}</span>
        </div>
    `
    : ''
}

const typeIcons = {
  user: `<svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24"
  fill="currentColor" viewBox="0 0 24 24" >
  <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2M4 19V5h16v3h-6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h6v3zm16-9v4h-6v-4z"></path>
  </svg>`,
  mixed: `<svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24"
  fill="currentColor" viewBox="0 0 24 24" >
  <path d="m21.49 7.13-9-5a.99.99 0 0 0-.97 0l-9.01 5C2.19 7.31 2 7.64 2 8v3c0 .55.45 1 1 1h2v4H3c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1h-2v-4h2c.55 0 1-.45 1-1V8a1 1 0 0 0-.51-.87M7 12h2v4H7zm6 0v4h-2v-4zm7 6v2H4v-2zm-3-2h-2v-4h2zm3-6H4V8.59l8-4.44 8 4.44z"></path><path d="M12 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3"></path>
  </svg>`,
  system: `<svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24"
  fill="currentColor" viewBox="0 0 24 24" >
  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4m0 6c-1.08 0-2-.92-2-2s.92-2 2-2 2 .92 2 2-.92 2-2 2"></path><path d="m20.42 13.4-.51-.29c.05-.37.08-.74.08-1.11s-.03-.74-.08-1.11l.51-.29c.96-.55 1.28-1.78.73-2.73l-1-1.73a2.006 2.006 0 0 0-2.73-.73l-.53.31c-.58-.46-1.22-.83-1.9-1.11v-.6c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v.6c-.67.28-1.31.66-1.9 1.11l-.53-.31c-.96-.55-2.18-.22-2.73.73l-1 1.73c-.55.96-.22 2.18.73 2.73l.51.29c-.05.37-.08.74-.08 1.11s.03.74.08 1.11l-.51.29c-.96.55-1.28 1.78-.73 2.73l1 1.73c.55.95 1.77 1.28 2.73.73l.53-.31c.58.46 1.22.83 1.9 1.11v.6c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-.6a8.7 8.7 0 0 0 1.9-1.11l.53.31c.95.55 2.18.22 2.73-.73l1-1.73c.55-.96.22-2.18-.73-2.73m-2.59-2.78c.11.45.17.92.17 1.38s-.06.92-.17 1.38a1 1 0 0 0 .47 1.11l1.12.65-1 1.73-1.14-.66c-.38-.22-.87-.16-1.19.14-.68.65-1.51 1.13-2.38 1.4-.42.13-.71.52-.71.96v1.3h-2v-1.3c0-.44-.29-.83-.71-.96-.88-.27-1.7-.75-2.38-1.4a1.01 1.01 0 0 0-1.19-.15l-1.14.66-1-1.73 1.12-.65c.39-.22.58-.68.47-1.11-.11-.45-.17-.92-.17-1.38s.06-.93.17-1.38A1 1 0 0 0 5.7 9.5l-1.12-.65 1-1.73 1.14.66c.38.22.87.16 1.19-.14.68-.65 1.51-1.13 2.38-1.4.42-.13.71-.52.71-.96v-1.3h2v1.3c0 .44.29.83.71.96.88.27 1.7.75 2.38 1.4.32.31.81.36 1.19.14l1.14-.66 1 1.73-1.12.65c-.39.22-.58.68-.47 1.11Z"></path>
  </svg>`,
}

function formatTransferType(transfer) {
  const label = getTypeLabel(transfer.type)
  const description = getTypeDescription(transfer.type)
  const icon = typeIcons[transfer.type]

  return `
    <div
      class="inline-flex items-center space-x-2"
      title="${description}"
    >
      <span class="w-5 h-5 flex items-center justify-center text-[#07FFFF]/50 shrink-0">
        ${icon}
      </span>
      <span class="text-white/90">
        ${label}
      </span>
    </div>
  `
}

function createTransferDetails(transfer) {
  const details = document.createElement('div')
  details.className = 'bg-white/5 rounded-xl p-4 space-y-2'
  details.id = 'transfer-details'

  details.innerHTML = `
    <div class="flex flex-col md:grid md:grid-cols-[auto_1fr] md:gap-4 text-sm text-white/90 pt-2">
      <div class="text-white/50 w-[6rem]">Type</div>
      ${formatTransferType(transfer)}

      <div class="text-white/50 w-[6rem]">Block</div>
      ${createCopyLinkHTML({
        text: transfer.blockNumber,
        url: getExplorerBlockLink(transfer.network, transfer.blockNumber),
        copyTextClasses: 'md:max-w-[40rem]',
      })}

      <div class="text-white/50 w-[6rem]">Timestamp</div>
      <div>${formatLocalAndUTC(new Date(transfer.sentAt))}</div>

      ${
        transfer.txPrimary
          ? `
        <div class="text-white/50 w-[6rem]">Tx Hash</div>
        ${createCopyLinkHTML({
          text: transfer.txPrimary,
          display: transfer.txPrimary,
          url: getExplorerTxLink(transfer.network, {
            hash: transfer.txPrimary,
            blockNumber: transfer.blockNumber,
            extrinsicIndex: transfer.txIndex,
          }),
          copyTextClasses: 'md:max-w-[40rem]',
        })}
        `
          : ``
      }

      ${
        transfer.txSecondary
          ? `
        <div class="text-white/50 w-[6rem]">EVM Tx Hash</div>
        ${createCopyLinkHTML({
          text: transfer.txSecondary,
          display: transfer.txSecondary,
          url: getExplorerTxLink(
            transfer.network,
            {
              hash: transfer.txSecondary,
            },
            'etherscan'
          ),
          copyTextClasses: 'md:max-w-[40rem]',
        })}
        `
          : ``
      }

      ${createTxMetaHTML(transfer)}
      ${createEventMetaHTML(transfer)}

      <div class="text-white/50 w-[6rem]">Asset ID</div>
      <div class="break-all">${transfer.asset.split('|')[1]}</div>
    </div>
    `

  return details
}

async function loadTransferDetail() {
  try {
    const selectId = window.location.hash.substring(1)
    const { items } = await getTransferById(selectId)
    const container = document.querySelector('.transaction-detail')

    container.innerHTML = ''

    if (items == null || items.length === 0) {
      container.appendChild(
        htmlToElement(`
  <div class="my-8 p-4 mx-auto text-lg text-white/90">
    <p>Sorry, we couldn't find that transfer.</p>
    <p class="mt-2">
      Please <a href="/intrachain/index.html" class="text-blue-400 underline hover:text-blue-600">go back to transfers</a> and try again.
    </p>
  </div>
`)
      )
      return
    }

    const transfer = items[0]
    const summary = createTransferSummary(transfer)
    const details = createTransferDetails(transfer)

    container.appendChild(summary)
    container.appendChild(details)
  } catch (err) {
    console.error('Error loading transaction:', err)
  }
}

window.onload = async () => {
  installCopyEventListener()

  await loadResources()
  await loadTransferDetail()
}
