"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataTablePaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  showPageSizeSelector?: boolean
  showItemsInfo?: boolean
  className?: string
}

export function DataTablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  pageSizeOptions = [25, 50, 100, 200],
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showItemsInfo = true,
  className,
}: DataTablePaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  const handleFirstPage = () => onPageChange(1)
  const handlePreviousPage = () => onPageChange(Math.max(1, currentPage - 1))
  const handleNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1))
  const handleLastPage = () => onPageChange(totalPages)

  // 生成页码按钮
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 7

    if (totalPages <= maxVisiblePages) {
      // 如果总页数不多，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 复杂的分页逻辑
      if (currentPage <= 4) {
        // 当前页在前面
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // 当前页在后面
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 当前页在中间
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className={`flex items-center justify-between px-2 ${className || ''}`}>
      <div className="flex items-center space-x-6 lg:space-x-8">
        {showPageSizeSelector && (
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">每页显示</p>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {showItemsInfo && (
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            第 {startItem}-{endItem} 项，共 {totalItems} 项
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={handleFirstPage}
          disabled={!canGoPrevious}
        >
          <span className="sr-only">跳转到第一页</span>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={handlePreviousPage}
          disabled={!canGoPrevious}
        >
          <span className="sr-only">上一页</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* 页码按钮 */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="flex h-8 w-8 items-center justify-center text-sm">
                  ...
                </span>
              ) : (
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(page as number)}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={handleNextPage}
          disabled={!canGoNext}
        >
          <span className="sr-only">下一页</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={handleLastPage}
          disabled={!canGoNext}
        >
          <span className="sr-only">跳转到最后一页</span>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
