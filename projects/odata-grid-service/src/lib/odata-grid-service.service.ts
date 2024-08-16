/*
The GridService is an abstract service class designed to interact with OData REST APIs. It provides a structured way to handle grid data operations such as filtering, sorting, pagination, and data retrieval in an Angular application. The service leverages RxJS to manage state and HTTP requests efficiently.
 */
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, finalize, map } from 'rxjs';

// Grid service made for specially odata rest.
export abstract class ODataGridService<T> {
  // Observable streams to manage grid data, total count, and loading state
  public data$ = new BehaviorSubject<T[]>(<T[]>[]);
  public totalCount$ = new BehaviorSubject<number>(0);
  public loading$ = new BehaviorSubject<boolean>(false);

  // Query options for OData
  protected select: string[] = [];
  protected expand: string[] = [];
  protected defaultFilter: DefaultFilter[] = [];
  protected defaultSorting: DefaultSorting[] = [];

  // API-related properties
  private readonly resourceUrl!: string;
  private baseUrl!: string;
  private http!: HttpClient;
  private totalCount: number = 0;
  private pageState!: PageState;
  private refreshUrl!: string;
  private filterString = '';
  private sortingString = '';

  // Constructor to initialize the service with base and resource URLs
  constructor(resourceUrl: string, baseUrl: string) {
    this.resourceUrl = resourceUrl;
    this.baseUrl = baseUrl;
    this.http = inject(HttpClient);
  }

  // Getter to access the resource URL
  get getResource() {
    return this.resourceUrl;
  }

  // Initiates a data fetch based on current state
  public read() {
    this.execute();
  }

  // Sets data manually to the data stream
  public setData(data: T[]) {
    this.data$.next(data);
  }

  // Refreshes the data by re-executing the last request
  public refresh() {
    this.execute(this.refreshUrl);
  }

  // Handles pagination state changes and triggers data fetch
  public onPageChange(state: any) {
    this.pageState = {
      skip: state?.first,
      top: state?.rows,
      total: this.totalCount,
    };
    this.execute();
  }

  // Handles filtering state changes and triggers data fetch
  public onFilterChange(event: TableFilterEvent | any) {
    const filters = Object.entries(event.filters);
    const filteredArr: any[] = [];
    filters.forEach((filter: any) => {
      const filtered = filter[1]?.[0];
      if (filtered?.value) {
        filteredArr.push({
          field: filter[0],
          filters: filter[1],
        });
      }
    });

    // Constructs filter string based on current filters
    const mainFilterString: string[] = [];
    filteredArr.forEach((filter) => {
      const filterQueries: string[] = [];
      let operator!: string;
      filter?.filters?.forEach((x: any) => {
        operator = x?.operator ?? 'and';
        const filterQuery = `${this.getFilterImplementation(
          filter.field,
          x?.matchMode,
          x?.value,
          x?.dataType
        )}`;
        filterQueries.push(filterQuery);
      });
      mainFilterString.push(filterQueries.join(` ${operator} `));
    });
    this.filterString = mainFilterString.join(' and ');
    this.execute();
  }

  // Handles sorting state changes and triggers data fetch
  public onSortChange(event: any) {
    const sortingColumn: any[] = event?.multisortmeta;
    const sortingString: string[] = [];
    sortingColumn.forEach((x: any) => {
      sortingString.push(`${x?.field} ${x?.order == 1 ? 'asc' : 'desc'}`);
    });
    this.sortingString = sortingString.join(', ');
    this.execute();
  }

  // Clears filters and sorting, then refreshes the data
  public onClear() {
    this.filterString = this.sortingString = '';
    this.execute();
  }

  // Maps FilterMatchMode to corresponding ODataMatchMode
  private getMatchMode(matchMode: FilterMatchMode): ODataMatchMode {
    switch (matchMode) {
      case (FilterMatchMode.EQUALS,
      FilterMatchMode.IS,
      FilterMatchMode.DATE_IS):
        return ODataMatchMode.EQ;
      case FilterMatchMode.IS:
        return ODataMatchMode.EQ;
      case FilterMatchMode.DATE_IS:
        return ODataMatchMode.EQ;
      case FilterMatchMode.NOT_EQUALS:
        return ODataMatchMode.NE;
      case FilterMatchMode.DATE_IS_NOT:
        return ODataMatchMode.NE;
      case FilterMatchMode.IS_NOT:
        return ODataMatchMode.NE;
      case FilterMatchMode.LESS_THAN:
        return ODataMatchMode.LESS_THAN;
      case FilterMatchMode.DATE_BEFORE:
        return ODataMatchMode.LESS_THAN;
      case FilterMatchMode.LESS_THAN_OR_EQUAL_TO:
        return ODataMatchMode.LESS_THAN_OR_EQUAL_TO;
      case FilterMatchMode.GREATER_THAN:
        return ODataMatchMode.GREATER_THAN;
      case FilterMatchMode.DATE_AFTER:
        return ODataMatchMode.GREATER_THAN;
      case FilterMatchMode.GREATER_THAN_OR_EQUAL_TO:
        return ODataMatchMode.GREATER_THAN_OR_EQUAL_TO;
      case FilterMatchMode.CONTAINS:
        return ODataMatchMode.CONTAINS;
      case FilterMatchMode.STARTS_WITH:
        return ODataMatchMode.STARTS_WITH;
      case FilterMatchMode.ENDS_WITH:
        return ODataMatchMode.ENDS_WITH;
      default:
        return ODataMatchMode.EQ;
    }
  }

  // Generates OData filter query string based on field, match mode, and value
  private getFilterImplementation(
    field: string,
    matchMode: FilterMatchMode,
    value: any,
    dataType: DataTypeEnum
  ): string {
    const odataMatchMode: ODataMatchMode = this.getMatchMode(matchMode);
    let actualValue;
    let valueType;
    if (dataType) {
      valueType = dataType;
    } else {
      valueType = typeof value;
    }

    // Format the value based on its type
    switch (valueType) {
      case DataTypeEnum.STIRNG:
        actualValue = `'${value}'`;
        break;
      default:
        actualValue = `${value}`;
        break;
    }

    // Return the appropriate OData query string based on match mode
    switch (odataMatchMode) {
      case ODataMatchMode.CONTAINS:
        return `${odataMatchMode}(${field},${actualValue})`;
      case ODataMatchMode.ENDS_WITH:
        return `${odataMatchMode}(${field},${actualValue})`;
      case ODataMatchMode.STARTS_WITH:
        return `${odataMatchMode}(${field},${actualValue})`;
      default:
        return `${field} ${odataMatchMode} ${actualValue}`;
    }
  }

  // Constructs the complete OData query string based on state and options
  private generateQueryString(): string {
    let url = `${this.baseUrl}/${this.resourceUrl}?$count=true&$top=${
      this.pageState?.top ?? 5
    }&$skip=${this.pageState?.skip ?? 0}`;

    // Append filter string to the query if available
    if (this.filterString !== '') {
      url += `&$filter=${this.filterString}`;
    }

    // Append default filter string if available
    if (this.defaultFilter.length > 0) {
      const mainDefaultFilterString: string[] = [];
      this.defaultFilter.forEach((x: any) => {
        mainDefaultFilterString.push(
          this.getFilterImplementation(
            x.field,
            x.matchMode,
            x.value,
            x.dataType
          )
        );
      });
      if (url.includes('&$filter')) {
        url += ' and ' + mainDefaultFilterString.join('and');
      } else {
        url += `&$filter=${mainDefaultFilterString.join('and')}`;
      }
    }

    // Append sorting string to the query if available
    if (this.sortingString !== '') {
      url += `&$orderby=${this.sortingString}`;
    }

    // Append default sorting string if available
    if (this.defaultSorting.length > 0) {
      url += `&$orderby=${this.sortingString}`;
      const defaultSortingString: string[] = [];
      this.defaultSorting.forEach((x: any) => {
        defaultSortingString.push(
          `${x?.field} ${x?.order == 1 ? 'asc' : 'desc'}`
        );
      });

      if (url.includes('&$orderby')) {
        url += '' + defaultSortingString.join(', ');
      } else {
        url += `&$orderby=${defaultSortingString.join(', ')}`;
      }
    }

    // Add select fields to the query if provided
    if (this.select.length > 0) {
      url += `&$select=${this.select.join(', ')}`;
    }

    // Add expand fields to the query if provided
    if (this.expand.length > 0) {
      url += `&$expand=${this.expand.join(', ')}`;
    }
    return url;
  }

  // Executes the HTTP request to fetch data based on the current query state
  private execute(refreshUrl = '') {
    let url = '';
    if (refreshUrl === '') {
      url = this.generateQueryString();
    }

    // If the URL hasn't changed, avoid redundant requests
    if (this.refreshUrl == url) return;
    this.refreshUrl = url;
    this.loading$.next(true);
    this.http
      .get(refreshUrl === '' ? url : refreshUrl)
      .pipe(
        map((res: any) => {
          this.totalCount = res?.['@odata.count'] ?? 0;
          this.totalCount$.next(this.totalCount);
          return res?.['value'] ?? [];
        }),
        finalize(() => {
          this.loading$.next(false);
        })
      )
      .subscribe({
        next: (res: T[]) => {
          this.data$.next(res ?? []);
        },
      });
  }
}

// Interface representing the state of pagination
export interface PageState {
  skip: number;
  top: number;
  total: number;
}

// Interface representing the default sorting options
export interface DefaultSorting {
  field: string;
  order: 1 | -1;
}

// Interface representing the default filter options
export interface DefaultFilter {
  field: string;
  matchMode: ODataMatchMode;
  value: any;
  dataType: DataTypeEnum;
}

// Enum representing OData match modes for filtering
export enum ODataMatchMode {
  EQ = 'eq',
  NE = 'ne',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL_TO = 'le',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL_TO = 'ge',
  CONTAINS = 'contains',
  STARTS_WITH = 'startswith',
  ENDS_WITH = 'endswith',
}

// Enum representing data types for filtering
export enum DataTypeEnum {
  STIRNG = 'string',
  NUMBER = 'number',
  DATE = 'date',
  FLOAT = 'float',
}

export enum FilterMatchMode {
  STARTS_WITH = 'startsWith',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  ENDS_WITH = 'endsWith',
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  IN = 'in',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL_TO = 'lte',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL_TO = 'gte',
  BETWEEN = 'between',
  IS = 'is',
  IS_NOT = 'isNot',
  BEFORE = 'before',
  AFTER = 'after',
  DATE_IS = 'dateIs',
  DATE_IS_NOT = 'dateIsNot',
  DATE_BEFORE = 'dateBefore',
  DATE_AFTER = 'dateAfter',
}

export interface TableFilterEvent {
  /**
   * Filter meta.
   */
  filters?: {
    [s: string]: any | undefined;
  };
  /**
   * Value after filter.
   */
  filteredValue?: any[] | any;
}
