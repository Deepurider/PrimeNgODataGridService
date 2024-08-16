# GridService With PrimeNg Table

## Overview

The `GridService` is an abstract service class designed to facilitate interactions with OData REST APIs in Angular applications. It provides a comprehensive solution for managing grid data operations such as filtering, sorting, pagination, and data retrieval. The service uses RxJS to handle state management and HTTP requests efficiently.

## Key Features

- **Observable Streams**
  - `data$`: Holds the current grid data as a `BehaviorSubject`.
  - `totalCount$`: Tracks the total number of items in the grid.
  - `loading$`: Indicates whether data is currently being loaded.

- **Query Options**
  - `select`: Specify fields to be selected in the OData query.
  - `expand`: Define related entities to include in the OData query.
  - `defaultFilter`: Apply default filtering rules.
  - `defaultSorting`: Apply default sorting rules.

- **API Interaction**
  - `resourceUrl`: The specific API endpoint for the resource.
  - `baseUrl`: The base URL of the API.
  - `http`: Utilizes Angular's `HttpClient` for HTTP requests.
  - `pageState`: Manages pagination state (`skip`, `top`, `total`).
  - `filterString`: Holds the current filter query parameters.
  - `sortingString`: Holds the current sorting query parameters.

## Methods

### `read()`
Initiates a data fetch based on the current state (pagination, filtering, sorting).

### `setData(data: T[])`
Manually sets the grid data.

### `refresh()`
Re-executes the last data fetch using the same query parameters.

### `onPageChange(state: any)`
Updates the pagination state and fetches data accordingly.

### `onFilterChange(event: TableFilterEvent | any)`
Updates the filter state and fetches data based on the new filters.

### `onSortChange(event: any)`
Updates the sorting state and fetches data based on the new sorting order.

### `onClear()`
Clears all filters and sorting options, then refreshes the data.

### `getMatchMode(matchMode: FilterMatchMode)`
Maps PrimeNG's `FilterMatchMode` to OData match modes.

### `getFilterImplementation(field: string, matchMode: string, value: any, dataType: DataTypeEnum)`
Constructs OData filter query strings.

### `generateQueryString()`
Builds the complete OData query string based on the current state.

### `execute(refreshUrl = '')`
Executes the HTTP request to fetch data using the generated query string.

## Utility Interfaces and Enums

### PageState
Interface representing pagination state:
- `skip`: Number of records to skip.
- `top`: Number of records to fetch.
- `total`: Total number of records available.

### DefaultSorting
Interface for default sorting configuration:
- `field`: The field to sort by.
- `order`: Sort order (`1` for ascending, `-1` for descending).

### DefaultFilter
Interface for default filter configuration:
- `field`: The field to filter by.
- `matchMode`: The OData match mode (e.g., `eq`, `contains`).
- `value`: The value to filter by.
- `dataType`: The data type (e.g., `string`, `number`).

### ODataMatchMode
Enum representing OData match modes for filtering:
- `EQ`: Equal (`eq`)
- `NE`: Not equal (`ne`)
- `LESS_THAN`: Less than (`lt`)
- `LESS_THAN_OR_EQUAL_TO`: Less than or equal to (`le`)
- `GREATER_THAN`: Greater than (`gt`)
- `GREATER_THAN_OR_EQUAL_TO`: Greater than or equal to (`ge`)
- `CONTAINS`: Contains (`contains`)
- `STARTS_WITH`: Starts with (`startswith`)
- `ENDS_WITH`: Ends with (`endswith`)

### DataTypeEnum
Enum defining the data types for filtering:
- `STRING`: String data type.
- `NUMBER`: Number data type.
- `DATE`: Date data type.
- `FLOAT`: Floating-point number data type.

## Usage

To use the `GridService`, extend it in a concrete service class for a specific entity type. For example:

```typescript
export class ProductGridService extends GridService<Product> {
  constructor() {
    super('products', 'https://api.example.com');
  }
}
