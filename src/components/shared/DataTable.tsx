import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import SearchInput from '@/components/forms/SearchInput'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  isLoading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  emptyMessage?: string
}

export default function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  searchable = true,
  searchPlaceholder = 'Search…',
  pageSize = 10,
  emptyMessage = 'No records found.',
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  return (
    <div className="space-y-3">
      {searchable && (
        <SearchInput
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder={searchPlaceholder}
          className="max-w-xs"
        />
      )}

      <div className="overflow-x-auto rounded-xl border border-brand-100">
        <table className="w-full text-sm">
          <thead className="bg-brand-50">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className="text-left py-3 px-4 text-xs font-semibold text-brand-700 uppercase tracking-wide whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 hover:text-brand-500 transition-colors"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort()
                          ? header.column.getIsSorted() === 'asc'
                            ? <ChevronUp className="w-3 h-3" />
                            : header.column.getIsSorted() === 'desc'
                              ? <ChevronDown className="w-3 h-3" />
                              : <ChevronsUpDown className="w-3 h-3 opacity-40" />
                          : null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <LoadingSpinner size="md" />
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-brand-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="border-t border-brand-50 hover:bg-brand-50/40 transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="py-3 px-4 text-[#1C0A00]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-brand-600 text-xs">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ·{' '}
            {table.getFilteredRowModel().rows.length} row(s)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg hover:bg-brand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-brand-600" />
            </button>
            {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
              const page = i
              return (
                <button
                  key={page}
                  onClick={() => table.setPageIndex(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    table.getState().pagination.pageIndex === page
                      ? 'bg-brand-500 text-white'
                      : 'hover:bg-brand-100 text-brand-600'
                  }`}
                >
                  {page + 1}
                </button>
              )
            })}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg hover:bg-brand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-brand-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
