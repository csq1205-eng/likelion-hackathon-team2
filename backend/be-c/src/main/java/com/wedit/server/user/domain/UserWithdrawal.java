package com.wedit.server.user.domain;

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
import java.time.LocalDateTime;

@Entity
@Table(name = "user_withdrawals")
public class UserWithdrawal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserWithdrawalStatus status;

    @Column(name = "deleted_scope", length = 1000)
    private String deletedScope;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected UserWithdrawal() {
    }

    private UserWithdrawal(User user, String reason) {
        this.user = user;
        this.reason = reason;
        this.status = UserWithdrawalStatus.REQUESTED;
        this.requestedAt = LocalDateTime.now();
    }

    public static UserWithdrawal create(User user, String reason) {
        return new UserWithdrawal(user, reason);
    }

    public void complete(String deletedScope) {
        this.status = UserWithdrawalStatus.COMPLETED;
        this.deletedScope = deletedScope;
        this.completedAt = LocalDateTime.now();
    }

    public void markProcessing(String deletedScope) {
        this.status = UserWithdrawalStatus.PROCESSING;
        this.deletedScope = deletedScope;
    }

    public void fail(String deletedScope) {
        this.status = UserWithdrawalStatus.FAILED;
        this.deletedScope = deletedScope;
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public UserWithdrawalStatus getStatus() {
        return status;
    }
}
