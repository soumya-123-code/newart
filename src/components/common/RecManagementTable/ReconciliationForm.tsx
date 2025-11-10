"use client";

import React, { useState, useEffect } from "react";
import styles from "./ReconciliationForm.module.scss";
import { ReconciliationRequest, ReviewerTier, User, UserGroup } from "@/types/reconciliation.types";
import Image from "next/image";

interface ReconciliationFormProps {
  formData: any;
  isEditMode: any;
  preparers: any;
  reviewers: any;
  preparerGroups: any;
  reviewerGroups: any;
  riskRatings: any;
  onChange: any;
  onSubmit: any;
  onCancel?: any;
  loading?: any;
}

const ReconciliationForm: React.FC<ReconciliationFormProps> = ({
  formData,
  isEditMode,
  preparers,
  reviewers,
  preparerGroups,
  reviewerGroups,
  riskRatings,
  onChange,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [reviewerTiers, setReviewerTiers] = useState<ReviewerTier[]>(formData.reviewerTiers || []);
  const [currentTier, setCurrentTier] = useState<ReviewerTier>({
    tier: 1,
    user: null,
    reviewerUserGroup: null,
  });
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(null);

  useEffect(() => {
    setReviewerTiers(formData.reviewerTiers || []);
  }, [formData.reviewerTiers]);

  const handleAddReviewerTier = () => {
    if (!currentTier.tier || (!currentTier.user && !currentTier.reviewerUserGroup)) {
      alert("Please select tier and either reviewer or reviewer group");
      return;
    }

    // Check if tier already exists
    const existingTierIndex = reviewerTiers.findIndex(rt => rt.tier === currentTier.tier);
    
    const newTier: ReviewerTier = {
      ...currentTier,
      reviewerName: currentTier.user?.fullName || currentTier.reviewerUserGroup?.name || '',
    };

    let updatedTiers;
    if (existingTierIndex >= 0) {
      // Update existing tier
      updatedTiers = [...reviewerTiers];
      updatedTiers[existingTierIndex] = newTier;
    } else {
      // Add new tier
      updatedTiers = [...reviewerTiers, newTier].sort((a, b) => a.tier - b.tier);
    }

    setReviewerTiers(updatedTiers);
    onChange({ ...formData, reviewerTiers: updatedTiers });
    
    // Reset current tier
    setCurrentTier({
      tier: Math.max(...updatedTiers.map(t => t.tier), 0) + 1,
      user: null,
      reviewerUserGroup: null,
    });
  };

  const handleRemoveReviewerTier = () => {
    if (selectedTierIndex === null) {
      alert("Please select a tier to remove");
      return;
    }

    const updatedTiers = reviewerTiers.filter((_, index) => index !== selectedTierIndex);
    setReviewerTiers(updatedTiers);
    onChange({ ...formData, reviewerTiers: updatedTiers });
    setSelectedTierIndex(null);
  };

  const handleInputChange = (field: keyof ReconciliationRequest, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.reconciliationName) {
      alert("Reconciliation name is required");
      return;
    }
    
    if (!formData.performer?.userUuid && !formData.preparerUserGroup?.id) {
      alert("Please select a preparer or preparer group");
      return;
    }

    if (reviewerTiers.length === 0) {
      alert("Please add at least one reviewer tier");
      return;
    }

    // Check if tiers are ordered
    const sortedTiers = [...reviewerTiers].sort((a, b) => a.tier - b.tier);
    for (let i = 0; i < sortedTiers.length; i++) {
      if (sortedTiers[i].tier !== i + 1) {
        alert("Reviewer tiers must be ordered sequentially starting from 1");
        return;
      }
    }

    onSubmit();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        {/* Reconciliation ID */}
        {isEditMode && (
          <div className={styles.formGroup}>
            <label>Reconciliation ID</label>
            <input
              type="text"
              value={formData.reconciliationId || ''}
              disabled
              className={styles.input}
            />
          </div>
        )}

        {/* Account Type */}
        <div className={styles.formGroup}>
          <label>Account type</label>
          <select
            value={formData.recType}
            onChange={(e) => handleInputChange('recType', e.target.value as any)}
            disabled={isEditMode}
            className={styles.select}
          >
            <option value="STANDARD">Standard</option>
            <option value="ROLLUP_PARENT">Rollup Parent</option>
            <option value="ROLLUP_CHILD">Rollup Child</option>
          </select>
        </div>

        {/* Preparer */}
        <div className={styles.formGroup}>
          <label>Preparer</label>
          <select
            value={formData.performer?.userUuid || ''}
            onChange={(e) => {
              const selected = preparers.find(p => p.userUuid === Number(e.target.value));
              handleInputChange('performer', selected || null);
            }}
            className={styles.select}
          >
            <option value="">Select preparer</option>
            {preparers.map((preparer) => (
              <option key={preparer.userUuid} value={preparer.userUuid}>
                {preparer.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Preparer Group */}
        <div className={styles.formGroup}>
          <label>Preparer group</label>
          <select
            value={formData.preparerUserGroup?.id || ''}
            onChange={(e) => {
              const selected = preparerGroups.find(g => g.id === Number(e.target.value));
              handleInputChange('preparerUserGroup', selected || null);
            }}
            className={styles.select}
          >
            <option value="">-</option>
            {preparerGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div className={styles.formGroup}>
          <label>Name</label>
          <input
            type="text"
            value={formData.reconciliationName}
            onChange={(e) => handleInputChange('reconciliationName', e.target.value)}
            required
            className={styles.input}
          />
        </div>

        {/* Risk */}
        <div className={styles.formGroup}>
          <label>Risk</label>
          <select
            value={formData.riskRating}
            onChange={(e) => handleInputChange('riskRating', e.target.value)}
            className={styles.select}
          >
            {riskRatings.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <label>Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={styles.input}
          />
        </div>

        {/* BS CAR split */}
        <div className={styles.formGroup}>
          <label>BS CAR split</label>
          <input
            type="text"
            value={formData.bsCarSplit}
            onChange={(e) => handleInputChange('bsCarSplit', e.target.value)}
            className={styles.input}
          />
        </div>

        {/* Divisional split */}
        <div className={styles.formGroup}>
          <label>Divisional split</label>
          <input
            type="text"
            value={formData.divisionalSplit}
            onChange={(e) => handleInputChange('divisionalSplit', e.target.value)}
            className={styles.input}
          />
        </div>

        {/* Division */}
        <div className={styles.formGroup}>
          <label>Division</label>
          <input
            type="text"
            value={formData.division}
            onChange={(e) => handleInputChange('division', e.target.value)}
            className={styles.input}
          />
        </div>

        {/* Category */}
        <div className={styles.formGroup}>
          <label>Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={styles.input}
          />
        </div>

        {/* Active */}
        <div className={styles.formGroup}>
          <label>Active</label>
          <select
            value={formData.disabled ? 'No' : 'Yes'}
            onChange={(e) => handleInputChange('disabled', e.target.value === 'No')}
            disabled={isEditMode}
            className={styles.select}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* Deadline priority */}
        <div className={styles.formGroup}>
          <label>Deadline priority</label>
          <select
            value={formData.deadlinePriority}
            onChange={(e) => handleInputChange('deadlinePriority', e.target.value as 'low' | 'high')}
            className={styles.select}
          >
            <option value="low">Low</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Frequency */}
        <div className={styles.formGroup}>
          <label>Frequency</label>
          <select
            value={formData.frequency}
            onChange={(e) => handleInputChange('frequency', e.target.value as 'MONTHLY' | 'QUARTERLY')}
            className={styles.select}
          >
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>
        </div>
      </div>

      {/* Assign reviewer section */}
      <div className={styles.reviewerSection}>
        <h3>Assign reviewer</h3>
        
        <div className={styles.reviewerInputs}>
          <div className={styles.formGroup}>
            <label>Tier</label>
            <select
              value={currentTier.tier}
              onChange={(e) => setCurrentTier({ ...currentTier, tier: Number(e.target.value) })}
              className={styles.select}
            >
              {[1, 2, 3].map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Reviewer</label>
            <select
              value={currentTier.user?.userUuid || ''}
              onChange={(e) => {
                const selected = reviewers.find(r => r.userUuid === Number(e.target.value));
                setCurrentTier({ ...currentTier, user: selected || null, reviewerUserGroup: null });
              }}
              className={styles.select}
            >
              <option value="">Select</option>
              {reviewers.map((reviewer) => (
                <option key={reviewer.userUuid} value={reviewer.userUuid}>
                  {reviewer.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Reviewer group</label>
            <select
              value={currentTier.reviewerUserGroup?.id || ''}
              onChange={(e) => {
                const selected = reviewerGroups.find(g => g.id === Number(e.target.value));
                setCurrentTier({ ...currentTier, reviewerUserGroup: selected || null, user: null });
              }}
              className={styles.select}
            >
              <option value="">Select</option>
              {reviewerGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAddReviewerTier}
            className={styles.addButton}
          >
            <Image src="/Plus.svg" alt="Add" width={16} height={16} />
            Add
          </button>
        </div>

        {/* Reviewer tiers table */}
        {reviewerTiers.length > 0 && (
          <div className={styles.tiersTable}>
            <table>
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Reviewer</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reviewerTiers.map((tier, index) => (
                  <tr
                    key={index}
                    onClick={() => setSelectedTierIndex(index)}
                    className={selectedTierIndex === index ? styles.selected : ''}
                  >
                    <td>{tier.tier}</td>
                    <td>{tier.reviewerName}</td>
                    <td>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTierIndex(index);
                          handleRemoveReviewerTier();
                        }}
                        className={styles.removeBtn}
                      >
                        <Image src="/Delete.svg" alt="Remove" width={16} height={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form actions */}
      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? "Processing..." : isEditMode ? "Update" : "Create"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ReconciliationForm;
