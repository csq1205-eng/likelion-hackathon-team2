package com.wedit.server.point.domain;

import com.wedit.server.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "point_transactions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_point_transactions_user_reference",
                        columnNames = {"user_id", "reference_type", "reference_id"}
                )
        }
)
public class PointTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private PointTransactionType transactionType;

    @Column(nullable = false)
    private int amount;

    @Column(nullable = false)
    private int balanceAfter;

    @Column(nullable = false, length = 100)
    private String reason;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected PointTransaction() {
    }

    private PointTransaction(
            User user,
            PointTransactionType transactionType,
            int amount,
            int balanceAfter,
            String reason,
            String referenceType,
            Long referenceId
    ) {
        this.user = user;
        this.transactionType = transactionType;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.reason = reason;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
    }

    public static PointTransaction earn(User user, int amount, int balanceAfter, String reason, String referenceType, Long referenceId) {
        return new PointTransaction(user, PointTransactionType.EARN, amount, balanceAfter, reason, referenceType, referenceId);
    }

    public static PointTransaction use(User user, int amount, int balanceAfter, String reason, String referenceType, Long referenceId) {
        return new PointTransaction(user, PointTransactionType.USE, amount, balanceAfter, reason, referenceType, referenceId);
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public PointTransactionType getTransactionType() {
        return transactionType;
    }

    public int getAmount() {
        return amount;
    }

    public String getReason() {
        return reason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
