"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "./page.module.scss";
import Image from "next/image";
import Pagination from "@/components/common/Pagination/Pagination";
import RecManagementTable, {
  IRecManagementTable,
} from "@/components/common/RecManagementTable/RecManagementTable";
import UploadModal from "@/components/common/RecManagementTable/UploadModal";
import RefreshResetModal from "@/components/common/RecManagementTable/RefreshResetModal";
import ReconciliationForm from "@/components/common/RecManagementTable/ReconciliationForm";
import SidePanel from "@/components/common/SidePanel/SidePanel";
import {
  getBulkUploadStatus,
  getAllReconciliations,
  getUsers,
  getUserGroups,
  getRiskRatings,
  createRec,
  updateRec,
  disableRec,
  enableRec,
  getAllUserGroups,
  refreshAndResetPeriod,
} from "@/services/admin/admin.service";
import {
  ReconciliationRequest,
  User,
  UserGroup,
} from "@/types/reconciliation.types";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const RecManagement = () => {
  const [activeTab, setActiveTab] = useState<"Bulk upload" | "Update reconciliations">(
    "Bulk upload"
  );
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Data states
  const [tableData, setTableData] = useState<IRecManagementTable[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [reconciliations, setReconciliations] = useState<any[]>([]);

  // Modals & Panels
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [refreshResetModalOpen, setRefreshResetModalOpen] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelMode, setSidePanelMode] = useState<"create" | "edit">("create");

  // Form data
  const [preparers, setPreparers] = useState<User[]>([]);
  const [reviewers, setReviewers] = useState<User[]>([]);
  const [preparerGroups, setPreparerGroups] = useState<UserGroup[]>([]);
  const [reviewerGroups, setReviewerGroups] = useState<UserGroup[]>([]);
  const [riskRatings, setRiskRatings] = useState<string[]>([]);

  const [formData, setFormData] = useState<ReconciliationRequest>({
  });

  const [selectedReconciliation, setSelectedReconciliation] = useState<any>(null);

  // Redux auth state
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [userId, setUserId] = useState<string | null>(null);

  // Set userId when user is available
  useEffect(() => {
    if (user?.userUuid) {
      setUserId(String(user.userUuid));
    }
  }, [user?.userUuid]);

  // Load initial data
  useEffect(() => {
    if (userId && isAuthenticated) {
      loadUsers();
      loadUserGroups();
      loadRiskRatings();
    }
  }, [userId, isAuthenticated]);

  // Load tab data when tab, page, or size changes
  useEffect(() => {
    if (userId && isAuthenticated) {
      loadTabData();
    }
  }, [activeTab, page, size, userId, isAuthenticated]);

  const loadTabData = async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    setSearchQuery("");

    try {
      if (activeTab === "Bulk upload") {
        await loadBulkUploadData();
      } else {
        await loadUpdateReconciliationsData();
      }
    } catch (error) {
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!userId) return;
    try {
      const response = await getUsers(userId);
      const users = response.users || [];
      const preparer = users.filter((u: User) => u.roles?.includes("PREPARER"));
      const reviewer = users.filter((u: User) => u.roles?.includes("REVIEWER"));

      setPreparers(preparer);
      setReviewers(reviewer);
    } catch (error) {
    }
  };

  const loadUserGroups = async () => {
    if (!userId) return;
    try {
      const response = await getAllUserGroups(userId);
      const groups = response.recGroups || [];
      setPreparerGroups(
        groups.filter((g: UserGroup) => g.groupType === "PREPARER")
      );
      setReviewerGroups(
        groups.filter((g: UserGroup) => g.groupType === "REVIEWER")
      );
    } catch (error) {
    }
  };

  const loadRiskRatings = async () => {
    if (!userId) return;
    try {
      const response = await getRiskRatings(userId);
      const ratings = response.map((r: any) => r.rating);
      setRiskRatings(ratings);
    } catch (error) {
    }
  };

  const loadBulkUploadData = async () => {
    if (!userId) return;
    try {
      const response = await getBulkUploadStatus(page, size, userId);
      const items = response.items || [];

      setTableData(items);
      setTotalCount(response.totalCount || items.length);
    } catch (error) {
      setTableData([]);
      setTotalCount(0);
    }
  };

  const loadUpdateReconciliationsData = async () => {
    if (!userId) return;
    try {
      const response = await getAllReconciliations(page, size, userId);
      const items = response.items || response.reconciliations || [];

      // Store full reconciliation data for editing
      setReconciliations(items);

      setTableData(items);
      setTotalCount(response.totalCount || items.length);
    } catch (error) {
      setTableData([]);
      setTotalCount(0);
    }
  };

  const handleTabChange = (tab: "Bulk upload" | "Update reconciliations") => {
    setActiveTab(tab);
    setPage(1);
    setSearchQuery("");
    setSidePanelOpen(false);
  };

  const handleCreateClick = () => {
    resetForm();
    setSidePanelMode("create");
    setSidePanelOpen(true);
  };

  const handleEditClick = (tableRow: IRecManagementTable) => {
    const rec = reconciliations.find((r) => r.id === tableRow.id);
    if (!rec) {
      return;
    }

    setSelectedReconciliation(rec);
    setFormData({
    });
    setSidePanelMode("edit");
    setSidePanelOpen(true);
  };

  const handleDisableClick = async (tableRow: IRecManagementTable) => {
    if (!confirm("Are you sure you want to disable this reconciliation?"))
      return;
    if (!userId) return;

    setLoading(true);
    try {
      await disableRec(tableRow.reconciliationId, userId);
      alert("Reconciliation disabled successfully");
      loadUpdateReconciliationsData();
    } catch (error: any) {
      alert(`Failed to disable reconciliation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableClick = async (tableRow: IRecManagementTable) => {
    if (!confirm("Are you sure you want to enable this reconciliation?"))
      return;
    if (!userId) return;

    setLoading(true);
    try {
      await enableRec(tableRow.reconciliationId, userId);
      alert("Reconciliation enabled successfully");
      loadUpdateReconciliationsData();
    } catch (error: any) {
      alert(`Failed to enable reconciliation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReconciliation = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      await createRec(formData, userId);
      alert("Reconciliation created successfully");
      setSidePanelOpen(false);
      resetForm();
      loadUpdateReconciliationsData();
    } catch (error: any) {
      alert(`Failed to create reconciliation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReconciliation = async () => {
    if (!selectedReconciliation || !userId) return;

    setLoading(true);
    try {
      await updateRec({ ...formData, id: selectedReconciliation.id }, userId);
      alert("Reconciliation updated successfully");
      setSidePanelOpen(false);
      resetForm();
      loadUpdateReconciliationsData();
    } catch (error: any) {
      alert(`Failed to update reconciliation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSuccess = async () => {
    if (userId) {
      try {
        await refreshAndResetPeriod(userId);
        alert("Period refreshed and reset successfully");
        loadBulkUploadData();
      } catch (error: any) {
        alert(`Failed to refresh period: ${error.message}`);
      }
    }
  };

  const handleUploadSuccess = () => {
    if (userId) {
      loadBulkUploadData();
    }
  };

  const resetForm = () => {
    setFormData({
      riskRating:
        riskRatings.length > 0 ? riskRatings[0] : "1. Low Risk, Low Impact",
    });
    setSelectedReconciliation(null);
  };

  const handleCloseSidePanel = () => {
    setSidePanelOpen(false);
    resetForm();
  };

  // Filter data based on search
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return tableData.filter((item) => {
      const searchFields = [
        item.reconciliationId,
        item.status,
        item.updateType,
        item.name,
        item.accountType,
        item.frequency,
        item.preparer,
        item.reviewer,
      ].filter(Boolean);

      return (
        !query ||
        searchFields.some((field) => field?.toLowerCase().includes(query))
      );
    });
  }, [tableData, searchQuery]);

  const start = (page - 1) * size;
  const end = Math.min(start + size, totalCount);

  if (!userId || !isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Authenticating...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Tab Buttons */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "Bulk upload" ? styles.active : ""
          }`}
          onClick={() => handleTabChange("Bulk upload")}
        >
          Bulk upload
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "Update reconciliations" ? styles.active : ""
          }`}
          onClick={() => handleTabChange("Update reconciliations")}
        >
          Update reconciliations
        </button>
      </div>

      {/* Section Heading */}
      <div className={styles.sectionHead}>
        <h2>
          {activeTab === "Bulk upload"
            ? "Bulk upload status"
            : "Update reconciliations"}
        </h2>
        <div className={styles.toolbar}>
          {activeTab === "Bulk upload" && (
            <>
              <button
                className={styles.toolBtn}
                onClick={() => setRefreshResetModalOpen(true)}
                disabled={loading}
              >
                <Image
                  src="/RefreshReset.svg"
                  alt="Refresh & Reset"
                  width={16}
                  height={16}
                />
                <span className={styles.btnText}>Refresh & reset</span>
              </button>
              <button
                className={styles.ghostSmall}
                onClick={() => setUploadModalOpen(true)}
                disabled={loading}
              >
                <Image src="/Upload.svg" alt="Upload" width={16} height={16} />
                <span>Upload</span>
              </button>
            </>
          )}
          {activeTab === "Update reconciliations" && (
            <>
              <button
                className={styles.toolBtn}
                onClick={loadTabData}
                disabled={loading}
              >
                <Image src="/Refresh.svg" alt="Refresh" width={16} height={16} />
                <span className={styles.btnText}>Refresh</span>
              </button>
              <button
                className={styles.ghostSmall}
                onClick={handleCreateClick}
                disabled={loading}
              >
                <Image src="/Plus.svg" alt="Create" width={16} height={16} />
                <span>Create</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {tableData.length > 0 && (
        <div className={styles.searchContainer}>
          <div className={styles.searchBar}>
            <Image src="/Search.svg" alt="Search" width={16} height={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      )}

      {/* Table - UNIFIED */}
      <div>
        {loading ? (
          <div className={styles.loadingState}>Loading...</div>
        ) : tableData.length === 0 ? (
          <div className={styles.emptyState}>No data found</div>
        ) : (
          <RecManagementTable
            data={filteredData}
            tableType={activeTab === "Bulk upload" ? "bulk" : "reconciliations"}
            onDownload={
              activeTab === "Update reconciliations"
                ? () => console.log("Download clicked")
                : undefined
            }
          />
        )}
      </div>

      {/* Pagination */}
      {tableData.length > 0 && (
        <div className={styles.footerBar}>
          <span className={styles.range}>
            {filteredData.length
              ? `${start + 1}-${end} of ${totalCount}`
              : "0-0 of 0"}
          </span>

          <Pagination
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(totalCount / size))}
            onPageChange={setPage}
          />

          <div className={styles.itemsPerPage}>
            <span>Items per page</span>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        userId={userId}
      />

      <RefreshResetModal
        isOpen={refreshResetModalOpen}
        onClose={() => setRefreshResetModalOpen(false)}
        onSuccess={handleRefreshSuccess}
        userId={userId}
      />

      {/* Side Panel */}
      <SidePanel
        isOpen={sidePanelOpen}
        onClose={handleCloseSidePanel}
        title={
          sidePanelMode === "create"
            ? "Create reconciliation"
            : "Amend reconciliation"
        }
      >
        <ReconciliationForm
          formData={formData}
          isEditMode={sidePanelMode === "edit"}
          preparers={preparers}
          reviewers={reviewers}
          preparerGroups={preparerGroups}
          reviewerGroups={reviewerGroups}
          riskRatings={riskRatings}
          onChange={setFormData}
          onSubmit={
            sidePanelMode === "create"
              ? handleCreateReconciliation
              : handleUpdateReconciliation
          }
          onCancel={handleCloseSidePanel}
          loading={loading}
        />
      </SidePanel>
    </div>
  );
};

export default RecManagement;
