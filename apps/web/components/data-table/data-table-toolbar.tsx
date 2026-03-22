"use client"

import { useRef, useEffect } from "react"
import { useQueryStates, type Nullable, type inferParserType } from "nuqs"
import { MagnifyingGlass, Funnel } from "@phosphor-icons/react"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Button } from "@workspace/ui/components/button"
import type { DataTableQueryParsers, ToolbarConfig } from "./types"

type QueryUpdates<TQueryParsers extends DataTableQueryParsers> = Partial<
  Nullable<inferParserType<TQueryParsers>>
>

interface DataTableToolbarProps<TQueryParsers extends DataTableQueryParsers> {
  config: ToolbarConfig<Extract<keyof TQueryParsers, string>>
  queryParsers: TQueryParsers
}

export function DataTableToolbar<TQueryParsers extends DataTableQueryParsers>({
  config,
  queryParsers,
}: DataTableToolbarProps<TQueryParsers>) {
  const [params, setParams] = useQueryStates(queryParsers, {
    shallow: false,
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchConfig = config.search
  const sortConfig = config.sort
  const searchKey = searchConfig?.paramKey
  const searchParam = searchKey ? params[searchKey] : undefined
  const searchDefaultValue = typeof searchParam === "string" ? searchParam : ""

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  function handleSearch(
    paramKey: Extract<keyof TQueryParsers, string>,
    value: string
  ) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      setParams(createPageResetUpdate(paramKey, value || null))
    }, 300)
  }

  function handleFilterChange(
    paramKey: Extract<keyof TQueryParsers, string>,
    value: string | null
  ) {
    setParams(
      createPageResetUpdate(paramKey, !value || value === "all" ? "" : value)
    )
  }

  function handleSortChange(
    paramKey: Extract<keyof TQueryParsers, string>,
    currentValue: string,
    options: { value: string }[]
  ) {
    const currentIndex = options.findIndex((o) => o.value === currentValue)
    const nextIndex = (currentIndex + 1) % options.length

    setParams(createPageResetUpdate(paramKey, options[nextIndex]!.value))
  }

  const activeSortOption = sortConfig
    ? (() => {
        const currentValue = params[sortConfig.paramKey]
        const selectedValue =
          typeof currentValue === "string"
            ? currentValue
            : sortConfig.options[0]!.value

        return (
          sortConfig.options.find((option) => option.value === selectedValue) ??
          sortConfig.options[0]!
        )
      })()
    : null

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 gap-3">
        {searchConfig && (
          <div className="relative max-w-sm flex-1">
            <MagnifyingGlass className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              key={searchDefaultValue}
              placeholder={searchConfig.placeholder}
              defaultValue={searchDefaultValue}
              onChange={(event) =>
                handleSearch(searchConfig.paramKey, event.target.value)
              }
              className="pl-9"
            />
          </div>
        )}

        {config.filters?.map((filter) => (
          <Select
            key={filter.paramKey}
            value={
              typeof params[filter.paramKey] === "string" &&
              params[filter.paramKey]
                ? params[filter.paramKey]
                : "all"
            }
            onValueChange={(value) =>
              handleFilterChange(filter.paramKey, value)
            }
          >
            <SelectTrigger className="w-[160px]">
              <Funnel className="mr-1 size-4" />
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.label}</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {sortConfig && activeSortOption && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const sortKey = sortConfig.paramKey

            handleSortChange(sortKey, activeSortOption.value, sortConfig.options)
          }}
          className="gap-1.5"
        >
          <>
            {activeSortOption.icon}
            {activeSortOption.label}
          </>
        </Button>
      )}
    </div>
  )

  function createPageResetUpdate(
    paramKey: Extract<keyof TQueryParsers, string>,
    value: string | null
  ): QueryUpdates<TQueryParsers> {
    return {
      [paramKey]: value,
      page: 1,
    } as unknown as QueryUpdates<TQueryParsers>
  }
}
