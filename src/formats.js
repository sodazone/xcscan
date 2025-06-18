export function humanizeNumber(
	value,
	maximumFractionDigits = 2,
	siSeparator = " ",
	locale = "en-US",
) {
	const absValue = Math.abs(value);

	const formatter = new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits,
	});
	const formatterSmall = new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 6,
	});
	if (absValue >= 1000000000000) {
		return `${formatter.format(value / 1000000000000) + siSeparator}T`;
	}
	if (absValue >= 1000000000) {
		return `${formatter.format(value / 1000000000) + siSeparator}B`;
	}
	if (absValue >= 1000000) {
		return `${formatter.format(value / 1000000) + siSeparator}M`;
	}
	if (absValue >= 100000) {
		return `${formatter.format(value / 1000) + siSeparator}K`;
	}
	if (absValue > 10000) {
		return formatter.format(Math.round(absValue));
	}
	if (absValue > 10) {
		return formatter.format(value);
	}

	return formatterSmall.format(value);
}

export const formatTxs = Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 2,
}).format;

export const formatAccounts = Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 2,
}).format;

export const formatRoundtrip = Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 2,
}).format;

export const formatAssetVolume = humanizeNumber;
