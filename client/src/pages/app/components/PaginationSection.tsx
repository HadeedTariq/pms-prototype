import { FC, useState, ChangeEvent, KeyboardEvent } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";

interface PaginationSectionProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  showQuickJump?: boolean;
  maxVisiblePages?: number;
}

const PaginationSection: FC<PaginationSectionProps> = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  maxVisiblePages = 7,
}) => {
  const [showStartEllipsis, setShowStartEllipsis] = useState<boolean>(false);
  const [showEndEllipsis, setShowEndEllipsis] = useState<boolean>(false);
  const [startJumpValue, setStartJumpValue] = useState<string>("");
  const [endJumpValue, setEndJumpValue] = useState<string>("");

  const hasPreviousPage: boolean = currentPage > 1;
  const hasNextPage: boolean = currentPage < totalPages;

  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      window.scrollTo({
        top: 10,
        behavior: "smooth",
      });
    }
  };

  const handleQuickJump = (value: string, type: "start" | "end"): void => {
    const page = parseInt(value, 10);
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page);
      if (type === "start") {
        setShowStartEllipsis(false);
        setStartJumpValue("");
      } else {
        setShowEndEllipsis(false);
        setEndJumpValue("");
      }
    }
  };

  const renderPageNumbers = (): JSX.Element[] => {
    const pages: JSX.Element[] = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i} className="cursor-pointer dark:text-white">
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className={currentPage === i ? "text-black" : ""}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      return pages;
    }

    pages.push(
      <PaginationItem key={1} className="cursor-pointer">
        <PaginationLink
          onClick={() => handlePageChange(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    if (startPage > 2) {
      pages.push(
        <PaginationItem key="start-ellipsis">
          {showStartEllipsis ? (
            <div className="flex items-center">
              <input
                type="number"
                value={startJumpValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setStartJumpValue(e.target.value)
                }
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    handleQuickJump(startJumpValue, "start");
                  } else if (e.key === "Escape") {
                    setShowStartEllipsis(false);
                    setStartJumpValue("");
                  }
                }}
                onBlur={() => {
                  if (startJumpValue) {
                    handleQuickJump(startJumpValue, "start");
                  } else {
                    setShowStartEllipsis(false);
                  }
                }}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                placeholder="Page"
                min="2"
                max={totalPages - 1}
                autoFocus
              />
              <button
                onClick={() => handlePageChange(1)}
                className="ml-1 p-1 text-gray-500 hover:text-gray-700"
                title="Go to first page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowStartEllipsis(true)}
              className="px-2 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Jump to page"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </PaginationItem>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages - 1) {
      pages.push(
        <PaginationItem key="end-ellipsis">
          {showEndEllipsis ? (
            <div className="flex items-center">
              <button
                onClick={() => handlePageChange(totalPages)}
                className="mr-1 p-1 text-gray-500 hover:text-gray-700"
                title="Go to last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={endJumpValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEndJumpValue(e.target.value)
                }
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    handleQuickJump(endJumpValue, "end");
                  } else if (e.key === "Escape") {
                    setShowEndEllipsis(false);
                    setEndJumpValue("");
                  }
                }}
                onBlur={() => {
                  if (endJumpValue) {
                    handleQuickJump(endJumpValue, "end");
                  } else {
                    setShowEndEllipsis(false);
                  }
                }}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                placeholder="Page"
                min={endPage + 1}
                max={totalPages}
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setShowEndEllipsis(true)}
              className="px-2 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Jump to page"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </PaginationItem>
      );
    }

    if (totalPages > 1) {
      pages.push(
        <PaginationItem key={totalPages} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pages;
  };

  return (
    <div className="flex flex-col items-center">
      <Pagination>
        <PaginationContent
          className="
        bg-white/80 dark:bg-[#0B0F19]/90
        backdrop-blur-sm
        rounded-xl
        shadow-md dark:shadow-[0_2px_12px_rgba(0,0,0,0.5)]
        px-4 py-2
        border border-gray-200 dark:border-gray-800
        transition-colors duration-300
      "
        >
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
              className={`
            ${
              !hasPreviousPage
                ? "pointer-events-none opacity-50"
                : "cursor-pointer hover:bg-green-100 dark:hover:bg-[#1A2B22]"
            }
            text-gray-700 dark:text-gray-300
            border border-transparent hover:border-green-400
            rounded-lg px-2 py-1 transition-all duration-200
          `}
              aria-disabled={!hasPreviousPage}
            />
          </PaginationItem>

          {/* Page Numbers */}
          {renderPageNumbers()}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              className={`
            ${
              !hasNextPage
                ? "pointer-events-none opacity-50"
                : "cursor-pointer hover:bg-green-100 dark:hover:bg-[#1A2B22]"
            }
            text-gray-700 dark:text-gray-300
            border border-transparent hover:border-green-400
            rounded-lg px-2 py-1 transition-all duration-200
          `}
              aria-disabled={!hasNextPage}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Page Info */}
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export default PaginationSection;
