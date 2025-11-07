'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'

import Pagination from '../Pagination/Pagination'
import styles from './MasterRecsTable.module.scss'
import { getPriorityColorCode, getPriorityIcon } from '@/app/utils/utils'
import SearchBar from '../SearchBar/SearchBar'

export interface IMasterRecsTable {
  id: string
  name: string
  reconciliationId: string
  priority: string
  status: string
  preparer: string
  reviewer: string
  deadline: string
  frequency: string
  accountType: string
  overdue: boolean
  description?: string
  riskRating?: string
  monthlyBalance?: string
  sectionABalance?: string
  ragRating?: string
  submissionDate?: string
  lastModifiedDate?: string
  division?: string
}

interface MasterRecsTableProps {
  data: IMasterRecsTable[]
  loading?: boolean
  onRowClick?: (item: IMasterRecsTable) => void
  onSelectionChange?: (selectedIds: string[]) => void
      handleRefresh:any;
        handleDownload:any;
}

// Status mapping from API to UI
const STATUS_MAPPING: Record<string, string> = {
  COMPLETED: 'Approved',
  NOT_STARTED: 'Draft',
  REJECTED: 'Rejected',
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'In Review',
  ACTIVE: 'Active',
  DRAFT: 'Draft'
}

// Priority mapping from API deadlines
const PRIORITY_MAPPING: Record<string, string> = {
  'WD5': 'High',
  'WD15': 'Low',
  'High': 'High',
  'Low': 'Low'
}

// Risk rating to priority mapping
const RISK_TO_PRIORITY: Record<string, string> = {
  '1. Low Risk, Low Impact': 'Low',
  '2. Low Risk, Medium Impact': 'Low',
  '3. Medium Risk, Low Impact': 'Medium',
  '4. Low Risk, High Impact': 'Medium',
  '5. Medium Risk, Medium Impact': 'High',
  '6. Medium Risk, High Impact': 'High',
  '7. Medium Risk, High Impact': 'High'
}

type SortField = 'reconciliationId' | 'name' | 'status' | 'accountType' | 'frequency' | 'priority' | 'preparer' | 'reviewer'
type SortOrder = 'asc' | 'desc'

// Filter state type
type FilterState = Record<string, string[]>

// Filter categories matching screenshot
const FILTER_CATEGORIES = [
  { key: 'user', label: 'User', icon: '', type: 'multiple' as const },
  { key: 'period', label: 'Period', icon: '', type: 'multiple' as const },
  { key: 'status', label: 'Status', icon: '', type: 'multiple' as const },
  { key: 'risk', label: 'Risk', icon: '', type: 'multiple' as const }
]

const MasterRecsTable: React.FC<MasterRecsTableProps> = ({ 
  data, 
  loading = false, 
  onRowClick, 
  onSelectionChange ,
      handleRefresh,
        handleDownload
}) => {
  // Main states
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(FILTER_CATEGORIES[0].key)
  const [categorySearch, setCategorySearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('reconciliationId')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0, width: 0 })
  const itemsPerPage = 10

  // Refs for positioning
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Transform API data to UI format
  const transformDataForDisplay = useCallback((item: IMasterRecsTable): IMasterRecsTable => {
    return {
      ...item,
      status: STATUS_MAPPING[item.status] || item.status,
      priority: PRIORITY_MAPPING[item.priority] || (item.riskRating ? RISK_TO_PRIORITY[item.riskRating] || 'Low' : 'Low'),
      accountType: item.division || item.accountType || 'Standard',
      overdue: item.ragRating !== 'Green' || item.overdue || false,
      frequency: item.frequency || 'Monthly',
      activeStatus: item.status === 'COMPLETED' ? 'Yes' : 'No'
    } as any
  }, [])


 const getStatusBadgeStyle = (status: string): React.CSSProperties => {
  const isApproved = status === 'Approved'
  return {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    backgroundColor: isApproved ? '#D4EDDA' : '#E2E3E5',
    color: isApproved ? '#155724' : '#383D41',
    border: `1px solid ${isApproved ? '#C3E6CB' : '#D6D8DB'}`
  }
}


  // Generate dynamic filter options
  const generateFilterOptions = useCallback(() => {
    const options: Record<string, any[]> = {}

    // User options (Preparer + Reviewer)
    const users = new Map<string, number>()
    data.forEach(item => {
      if (item.preparer && item.preparer !== 'NA') {
        users.set(item.preparer, (users.get(item.preparer) || 0) + 1)
      }
      if (item.reviewer && item.reviewer !== 'NA') {
        users.set(item.reviewer, (users.get(item.reviewer) || 0) + 1)
      }
    })
    options.user = Array.from(users.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ value: label.trim(), label: label.trim(), count }))

    // Period options from deadline
    const periods = new Map<string, number>()
    data.forEach(item => {
      if (item.deadline) {
        const period = new Date(item.deadline).toLocaleDateString('en-GB', { 
          month: 'short', 
          year: 'numeric' 
        })
        periods.set(period, (periods.get(period) || 0) + 1)
      }
    })
    options.period = Array.from(periods.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([label, count]) => ({ value: label, label, count }))

    // Status options
    const statusOptions = [
      { value: 'Draft', label: 'Draft', count: 0 },
      { value: 'Submitted', label: 'Submitted', count: 0 },
      { value: 'In Review', label: 'In Review', count: 0 },
      { value: 'Approved', label: 'Approved', count: 0 },
      { value: 'Rejected', label: 'Rejected', count: 0 },
      { value: 'Active', label: 'Active', count: 0 }
    ]
    
    const transformedData = data.map(transformDataForDisplay)
    statusOptions.forEach(option => {
      option.count = transformedData.filter(item => 
        item.status.toLowerCase() === option.value.toLowerCase()
      ).length
    })
    options.status = statusOptions

    // Risk options
    const riskOptions = [
      { value: 'High', label: 'High Risk', count: 0 },
      { value: 'Medium', label: 'Medium Risk', count: 0 },
      { value: 'Low', label: 'Low Risk', count: 0 }
    ]
    riskOptions.forEach(option => {
      option.count = transformedData.filter(item => 
        item.priority.toLowerCase() === option.value.toLowerCase()
      ).length
    })
    options.risk = riskOptions

    return options
  }, [data, transformDataForDisplay])

  const filterOptions = useMemo(() => generateFilterOptions(), [generateFilterOptions])

  // FIXED: Improved filter matching logic
  const applyFilters = useCallback((item: IMasterRecsTable) => {
    const transformedItem = transformDataForDisplay(item)
    
    // Search filter
    const matchesSearch = !searchTerm || 
      transformedItem.reconciliationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transformedItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transformedItem.preparer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transformedItem.reviewer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transformedItem.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    // Category filters
    for (const [category, selectedValues] of Object.entries(filters)) {
      if (!selectedValues?.length) continue

      let itemValue: string | string[] = ''

      switch (category) {
        case 'user':
          itemValue = [transformedItem.preparer, transformedItem.reviewer].filter(Boolean)
          break
        case 'period':
          if (transformedItem.deadline) {
            itemValue = new Date(transformedItem.deadline).toLocaleDateString('en-GB', { 
              month: 'short', 
              year: 'numeric' 
            })
          }
          break
        case 'status':
          itemValue = transformedItem.status
          break
        case 'risk':
          itemValue = transformedItem.priority
          break
        default:
          itemValue = ''
      }

      let matchesCategory = false
      if (Array.isArray(itemValue)) {
        // For users - match if any selected user matches preparer OR reviewer
        matchesCategory = selectedValues.some(selectedValue => 
          itemValue.some(user => 
            user.toLowerCase().includes(selectedValue.toLowerCase()) ||
            selectedValue.toLowerCase().includes(user.toLowerCase())
          )
        )
      } else {
        // For other categories - exact match
        matchesCategory = selectedValues.some(value => 
          itemValue.toLowerCase().includes(value.toLowerCase())
        )
      }

      if (!matchesCategory) return false
    }

    return true
  }, [searchTerm, filters, transformDataForDisplay])

  // Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data
      .map(transformDataForDisplay)
      .filter(applyFilters)

    // Sort data
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortField === 'priority') {
        const priorityOrder:any = { High: 1, Medium: 2, Low: 3 }
        aValue = priorityOrder[aValue as string] || 4
        bValue = priorityOrder[bValue as string] || 4
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [data, applyFilters, sortField, sortOrder, transformDataForDisplay])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex)

  // Calculate responsive panel position
  const calculatePanelPosition = useCallback(() => {
    if (!filterButtonRef.current || !containerRef.current) return

    const buttonRect = filterButtonRef.current.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    // Base positioning - below button
    let top = buttonRect.bottom + 8 // 8px gap
    let left = buttonRect.left
    let width = Math.min(600, windowWidth - 32) // Responsive width

    // Check if panel would go off screen horizontally
    const panelRight = left + width
    if (panelRight > windowWidth - 16) {
      // Shift left to fit
      left = windowWidth - 16 - width
      if (left < 16) {
        // Still too wide, use full width
        left = 16
        width = windowWidth - 32
      }
    }

    if (left < 16) {
      left = 16
    }

    // Check if panel would go off screen vertically (desktop)
    const spaceBelow = windowHeight - buttonRect.bottom
    const panelHeight = Math.min(500, windowHeight * 0.8)
    
    if (spaceBelow < panelHeight && buttonRect.top > panelHeight) {
      // Try positioning above button
      top = buttonRect.top - panelHeight - 8
      if (top < containerRect.top + 16) {
        // Not enough space above, use below and allow scroll
        top = buttonRect.bottom + 8
      }
    }

    // Mobile/Tablet - Center and use full width
    if (windowWidth < 768) {
      left = 16
      width = windowWidth - 32
      top = Math.max(16, (windowHeight - panelHeight) / 2) // Center vertically
    }

    setPanelPosition({ top, left, width })
  }, [])

  // Calculate position when panel opens or window resizes
  useEffect(() => {
    if (showFilterPanel) {
      calculatePanelPosition()
      // Recalculate on window resize
      const handleResize = () => {
        calculatePanelPosition()
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [showFilterPanel, calculatePanelPosition])

  // Event handlers
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }, [sortField, sortOrder])

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = paginatedData.map(r => r.reconciliationId)
      setSelectedRows(allIds)
      onSelectionChange?.(allIds)
    } else {
      setSelectedRows([])
      onSelectionChange?.([])
    }
  }, [paginatedData, onSelectionChange])

  const handleRowSelect = useCallback((id: string, checked: boolean) => {
    let newSelected: string[]
    if (checked) {
      newSelected = [...selectedRows, id]
    } else {
      newSelected = selectedRows.filter(rowId => rowId !== id)
    }
    setSelectedRows(newSelected)
    onSelectionChange?.(newSelected)
  }, [selectedRows, onSelectionChange])

  const handleFilterToggle = useCallback((category: string, value: string) => {
    setFilters(prevFilters => {
      const currentSelection = prevFilters[category] || []
      let newSelection: string[]

      const categoryConfig:any = FILTER_CATEGORIES.find(cat => cat.key === category)
      if (!categoryConfig) {
        return prevFilters
      }

      if (categoryConfig.type === 'single') {
        newSelection = currentSelection.includes(value) ? [] : [value]
      } else {
        if (currentSelection.includes(value)) {
          newSelection = currentSelection.filter(v => v !== value)
        } else {
          newSelection = [...currentSelection, value]
        }
      }

      setCurrentPage(1)
      return { 
        ...prevFilters, 
        [category]: newSelection 
      }
    })
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({})
    setCategorySearch('')
    setCurrentPage(1)
    setShowFilterPanel(false)
  }, [])

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category)
    setCategorySearch('')
  }, [])

  



  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterButtonRef.current && filterPanelRef.current) {
        if (!filterButtonRef.current.contains(event.target as Node) && 
            !filterPanelRef.current.contains(event.target as Node)) {
          setShowFilterPanel(false)
        }
      }
    }

    if (showFilterPanel) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilterPanel])

  // Close panel on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowFilterPanel(false)
      }
    }

    if (showFilterPanel) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showFilterPanel])

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).reduce((total, categoryFilters) => {
      return total + (categoryFilters?.length || 0)
    }, 0)
  }, [filters])

  const getSortIconClass = (field: SortField) => {
    if (sortField !== field) return styles.sortIcon
    return sortOrder === 'asc' 
      ? `${styles.sortIcon} ${styles.sortAsc}` 
      : `${styles.sortIcon} ${styles.sortDesc}`
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.tableContainer} ref={containerRef}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxColumn}></th>
                <th className={`${styles.sortable} ${styles.idColumn}`}>
                  <div className={styles.skeletonHeader}></div>
                </th>
                <th className={styles.sortable}>
                  <div className={styles.skeletonHeader}></div>
                </th>
                <th className={styles.sortable}>
                  <div className={styles.skeletonHeader}></div>
                </th>
                <th className={styles.sortable}>
                  <div className={styles.skeletonHeader}></div>
                </th>
                <th className={styles.sortable}>
                  <div className={styles.skeletonHeader}></div>
                </th>
                <th className={styles.sortable}>
                  <div className={styles.skeletonHeader}></div>
                </th>
                <th className={styles.sortable}>
                  <div className={styles.skeletonHeader}></div>
                </th>
                <th className={styles.sortable}>
                  <div className={styles.skeletonHeader}></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td className={styles.checkboxColumn}>
                    <div className={styles.skeletonCheckbox}></div>
                  </td>
                  <td className={styles.skeletonCell}></td>
                  <td className={styles.skeletonCell}></td>
                  <td className={styles.skeletonCellShort}></td>
                  <td className={styles.skeletonCell}></td>
                  <td className={styles.skeletonCellShort}></td>
                  <td className={styles.skeletonCellShort}></td>
                  <td className={styles.skeletonCell}></td>
                  <td className={styles.skeletonCell}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.tableContainer} ref={containerRef}>

        <div className={styles.sectionHead}>
              <h2>Master reconciliations</h2>
              <div className={styles.toolbar}>
                <div className={styles.actionButtons}>
                <div className={styles.searchContainer}>
          <SearchBar 
            value={searchTerm} 
            onChange={(e: { target: { value: React.SetStateAction<string> } }) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }} 
          />
        </div>
          {/* Filter Button */}
          <div className={styles.filterButtonContainer}>
            <button 
              ref={filterButtonRef}
              className={`${styles.filterButton} ${
                activeFilterCount > 0 ? styles.active : ''
              } ${showFilterPanel ? styles.open : ''}`}
              onClick={() => {
                setShowFilterPanel(!showFilterPanel)
                if (!showFilterPanel) {
                  // Calculate position when opening
                  setTimeout(calculatePanelPosition, 0)
                }
              }}
            >
              <Image src="/Filter.svg" alt="Filter" width={16} height={16} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className={styles.filterBadge}>{activeFilterCount}</span>
              )}
              <Image 
                src={showFilterPanel ? '/ChevronUp.svg' : '/ChevronDown.svg'} 
                alt={showFilterPanel ? 'Close' : 'Open'} 
                width={12} 
                height={12} 
                className={styles.chevronIcon}
              />
            </button>
          </div>

          {/* Refresh Button */}
          <button 
            className={`${styles.actionButton} ${isRefreshing ? styles.refreshing : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            
            <Image 
              src={isRefreshing ? '/Spinner.svg' : '/Refresh.svg'} 
              alt="Refresh" 
              width={16} 
              height={16}
            />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Download Button */}
          <button 
            className={styles.actionButton}
            onClick={handleDownload}
            disabled={paginatedData.length === 0}
          >
            <Image src="/Download.svg" alt="Download" width={16} height={16} />
            Download
          </button>
        </div>
              </div>
            </div>
      

      {/* FIXED: Responsive Filter Panel - Positioned below button */}
      {showFilterPanel && (
        <div 
          ref={filterPanelRef} 
          className={styles.filterPanel}
          style={{
            position: 'fixed',
            top: `${panelPosition.top}px`,
            left: `${panelPosition.left}px`,
            width: `${panelPosition.width}px`,
            zIndex: 10000,
            transform: 'none'
          }}
        >
          <div className={styles.filterPanelContent}>
            <div className={styles.categoriesColumn}>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Filter by</span>
                <button 
                  className={styles.clearAllBtn}
                  onClick={handleClearFilters}
                  disabled={activeFilterCount === 0}
                >
                  Reset filters
                </button>
              </div>
              
              <div className={styles.categoriesList}>
                {FILTER_CATEGORIES.map(category => {
                  const currentSelection = filters[category.key] || []
                  const count = currentSelection.length
                  const isSelected = selectedCategory === category.key
                  const options = filterOptions[category.key] || []
                  const totalCount = options.reduce((sum, opt) => sum + opt.count, 0)

                  return (
                    <div 
                      key={category.key}
                      className={`${styles.categoryItem} ${isSelected ? styles.selectedCategory : ''}`}
                      onClick={() => handleCategorySelect(category.key)}
                    >
                      <div className={styles.categoryHeader}>
                        <span className={styles.categoryIcon}>{category.icon}</span>
                        <span className={styles.categoryLabel}>{category.label}</span>
                        <div className={styles.categoryCounts}>
                          {count > 0 && (
                            <span className={styles.selectedCount}>{count}</span>
                          )}
                          <span className={styles.totalCount}>{totalCount}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

             
             
            </div>

            <div className={styles.optionsColumn}>
              <div className={styles.optionsHeader}>
                <div className={styles.categorySearchContainer}>
                  <Image 
                    src="/Search.svg" 
                    alt="Search options" 
                    width={16} 
                    height={16}
                    className={styles.categorySearchIcon}
                  />
                  <input 
                    type="text" 
                    placeholder={`Search ${FILTER_CATEGORIES.find(c => c.key === selectedCategory)?.label || ''}...`}
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className={styles.categorySearchInput}
                  />
                </div>
              </div>

              <div className={styles.optionsList}>
                {(() => {
                  const category = FILTER_CATEGORIES.find(c => c.key === selectedCategory)
                  if (!category) {
                    return <div className={styles.noOptions}>No category selected</div>
                  }

                  const options = filterOptions[selectedCategory] || []
                  const filteredOptions = options.filter(option =>
                    option.label.toLowerCase().includes(categorySearch.toLowerCase())
                  )

                  if (filteredOptions.length === 0) {
                    return (
                      <div className={styles.noOptions}>
                        <span>No options found</span>
                      </div>
                    )
                  }

                  return filteredOptions.map(option => {
                    const isChecked = filters[selectedCategory]?.includes(option.value) || false
                    return (
                      <div 
                        key={option.value} 
                        className={`${styles.optionItem} ${isChecked ? styles.checked : ''}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleFilterToggle(selectedCategory, option.value)
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            handleFilterToggle(selectedCategory, option.value)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.optionCheckbox}
                        />
                        <div className={styles.optionContent}>
                          <span className={styles.optionLabel}>{option.label}</span>
                          <span className={styles.optionCount}>{option.count}</span>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
           <div className={styles.filterFooter}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => setShowFilterPanel(false)}
                >
                  Cancel
                </button>
          
                <button 
                  className={`${styles.applyBtn} ${activeFilterCount === 0 ? styles.disabled : ''}`}
                  onClick={() => setShowFilterPanel(false)}
                  disabled={activeFilterCount === 0}
                >
                  Apply
                </button>
              </div>
        </div>
      )}

      {/* Overlay for mobile */}
      {showFilterPanel && window.innerWidth < 768 && (
        <div 
          className={styles.filterOverlay}
          onClick={() => setShowFilterPanel(false)}
        />
      )}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxColumn}>
                <input 
                  type="checkbox" 
                  checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th 
                onClick={() => handleSort('reconciliationId')}
                className={`${styles.sortable} ${styles.idColumn}`}
              >
                Reconciliation ID
                <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={getSortIconClass('reconciliationId')} />
              </th>
              <th 
                onClick={() => handleSort('name')}
                className={styles.sortable}
              >
                Name
                <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={getSortIconClass('name')} />
              </th>
              <th 
                onClick={() => handleSort('status')}
                className={styles.sortable}
              >
                Active
                <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={getSortIconClass('status')} />
              </th>
              <th 
                onClick={() => handleSort('accountType')}
                className={styles.sortable}
              >
                Account Type
                <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={getSortIconClass('accountType')} />
              </th>
              <th 
                onClick={() => handleSort('frequency')}
                className={styles.sortable}
              >
                Frequency
                <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={getSortIconClass('frequency')} />
              </th>
              <th 
                onClick={() => handleSort('priority')}
                className={styles.sortable}
              >
                Risk
                <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={getSortIconClass('priority')} />
              </th>
              <th 
                onClick={() => handleSort('preparer')}
                className={styles.sortable}
              >
                Preparer
                <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={getSortIconClass('preparer')} />
              </th>
              <th 
                onClick={() => handleSort('reviewer')}
                className={styles.sortable}
              >
                Reviewer
                <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={getSortIconClass('reviewer')} />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.noResults}>
                  {searchTerm || activeFilterCount > 0 
                    ? `No results found for "${searchTerm}" with ${activeFilterCount} filters applied` 
                    : 'No master reconciliations found'
                  }
                </td>
              </tr>
            ) : (
              paginatedData.map(item => (
                <tr 
                  key={`${item.id}-${item.reconciliationId}`}
                  className={item.overdue ? `${styles.tableRow} ${styles.overdueRow}` : styles.tableRow}
                  onClick={() => onRowClick?.(item)}
                >
                  <td className={styles.checkboxColumn} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedRows.includes(item.reconciliationId)}
                      onChange={(e) => handleRowSelect(item.reconciliationId, e.target.checked)}
                    />
                  </td>
                  <td className={`${styles.idCell} ${styles.cell}`}>
                    <span className={styles.reconciliationId}>{item.reconciliationId}</span>
                  </td>
                  <td className={`${styles.idCell} ${styles.cell}`}>
                    <div className={styles.cellContent}>
                      <span 
                        className={styles.nameText}
                        title={item.description}
                      >
                        {item.name?.length > 50 
                          ? `${item.name.substring(0, 50)}...` 
                          : item.name || item.description || 'N/A'
                        }
                      </span>
                      {item.riskRating && (
                        <div className={styles.riskBadge} title={item.riskRating}>
                          <span>{item.riskRating.split('.')[0].trim()}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={`${styles.statusCell} ${styles.cell}`}>
                  <td className={`${styles.statusCell} ${styles.cell}`}>
  <span style={getStatusBadgeStyle(item.status === 'Approved' ? 'Approved' : 'Pending')}>
    {item.status === 'Approved' ? 'Yes' : 'No'}
  </span>
</td>

                  </td>
                  <td className={`${styles.accountTypeCell} ${styles.cell}`}>
                    <span>{item.accountType || 'Standard'}</span>
                  </td>
                  <td className={`${styles.frequencyCell} ${styles.cell}`}>
                    <span>{item.frequency || 'Monthly'}</span>
                  </td>
                  <td className={`${styles.priorityCell} ${styles.cell}`}>
                    <div className={styles.priorityContainer}>
                      <span 
                        className={`priority-badge priority-${getPriorityColorCode(item.priority)}`}
                      >
                        {getPriorityIcon(item.priority, getPriorityColorCode(item.priority))}
                        <span>{item.priority || 'Low'}</span>
                      </span>
                      {item.overdue && <span className={styles.overdueIndicator}></span>}
                    </div>
                  </td>
                  <td className={`${styles.personCell} ${styles.cell}`}>
                    <div className={styles.personInfo}>
                      <span title={item.preparer}>{item.preparer || 'N/A'}</span>
                      {item.submissionDate && (
                        <span className={styles.personDate}>{formatDate(item.submissionDate)}</span>
                      )}
                    </div>
                  </td>
                  <td className={`${styles.personCell} ${styles.cell}`}>
                    <div className={styles.personInfo}>
                      <span title={item.reviewer}>{item.reviewer || 'N/A'}</span>
                      {item.lastModifiedDate && (
                        <span className={styles.personDate}>{formatDate(item.lastModifiedDate)}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results Info */}
      {filteredAndSortedData.length > 0 && (
        <div className={styles.resultsInfo}>
          <span className={styles.resultsText}>
            Showing {startIndex + 1} to {endIndex} of {filteredAndSortedData.length} results
            {searchTerm && ` for "${searchTerm}"`}
            {(!searchTerm && activeFilterCount > 0) && ` with ${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} applied`}
          </span>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationWrapper}>
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Selection Info */}
      {selectedRows.length > 0 && (
        <div className={styles.selectionInfo}>
          <span>
            {selectedRows.length} {selectedRows.length === 1 ? 'item' : 'items'} selected
          </span>
        </div>
      )}
    </div>
  )
}

export default MasterRecsTable
