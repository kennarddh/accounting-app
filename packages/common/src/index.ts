export enum SortOrder {
	Ascending = 'asc',
	Descending = 'desc',
}

export enum ApiErrorResource {
	Endpoint = 'Endpoint',
	RateLimit = 'RateLimit',
	RefreshToken = 'RefreshToken',
	AccessToken = 'AccessToken',
	User = 'User',
	UserSession = 'UserSession',
	Username = 'Username',
	Duration = 'Duration',
	DateTime = 'DateTime',
	Account = 'Account',
	JournalEntry = 'JournalEntry',
	Category = 'Category',
	Product = 'Product',
	Order = 'Order',
	OrderItem = 'OrderItem',
	StockMovement = 'StockMovement',
}

export enum ApiErrorKind {
	NotFound = 'NotFound',
	Unauthorized = 'Unauthorized',
	Invalid = 'Invalid',
	Inactive = 'Inactive',
	Disabled = 'Disabled',
	Exceeded = 'Exceeded',
	Expired = 'Expired',
	Taken = 'Taken',
	CannotBeArray = 'CannotBeArray',
	InternalServerError = 'InternalServerError',
	Processed = 'Processed',
	Unavailable = 'Unavailable',
}

export interface ApiOtherError {
	resource: ApiErrorResource | null
	kind: ApiErrorKind
	field?: string // The exact input or array field (e.g., "entryNumber", "lines[2].accountId")
	meta?: Record<string, string | number> // Dynamic values for i18n interpolation (e.g., { code: "101", name: "Cash" })
}

export enum UserSessionSortField {
	CreatedAt = 'createdAt',
	LastRefreshAt = 'lastRefreshAt',
	ExpireAt = 'expireAt',
}

export enum UserSortField {
	Name = 'name',
	CreatedAt = 'createdAt',
}

export enum AccountSortField {
	Name = 'name',
	Code = 'code',
	CreatedAt = 'createdAt',
}

export enum AccountType {
	Asset = 'Asset',
	Liability = 'Liability',
	Equity = 'Equity',
	Revenue = 'Revenue',
	Expense = 'Expense',
}

export enum FilterEnableDisable {
	Active = 'Active',
	All = 'All',
	Disabled = 'Disabled',
}

export enum JournalEntrySortField {
	Date = 'date',
	CreatedAt = 'createdAt',
	EntryNumber = 'entryNumber',
}

export enum OrderStatus {
	Completed = 'Completed',
	Cancelled = 'Cancelled',
	Refunded = 'Refunded',
}

export enum PaymentMethod {
	Cash = 'Cash',
	BankTransfer = 'BankTransfer',
	Card = 'Card',
	QRIS = 'QRIS',
}

export enum StockMovementType {
	Sale = 'Sale',
	Purchase = 'Purchase',
	Waste = 'Waste',
	Correction = 'Correction',
	Return = 'Return',
}

export enum CategorySortField {
	Name = 'name',
	CreatedAt = 'createdAt',
}
