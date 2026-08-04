package com.welllog.server.group.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "group_invites")
public class GroupInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Column(name = "invite_code", nullable = false, unique = true, length = 6)
    private String inviteCode;

    @Column(name = "invite_url", length = 500)
    private String inviteUrl;

    @Column(name = "qr_image_url", length = 500)
    private String qrImageUrl;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected GroupInvite() {
    }

    private GroupInvite(Group group, String inviteCode, String inviteUrl) {
        this.group = group;
        this.inviteCode = inviteCode;
        this.inviteUrl = inviteUrl;
    }

    public static GroupInvite create(Group group, String inviteCode, String inviteUrl) {
        return new GroupInvite(group, inviteCode, inviteUrl);
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Group getGroup() {
        return group;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public String getInviteUrl() {
        return inviteUrl;
    }

    public String getQrImageUrl() {
        return qrImageUrl;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
}
