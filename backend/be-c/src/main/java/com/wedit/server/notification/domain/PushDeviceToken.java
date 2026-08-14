package com.wedit.server.notification.domain;

import com.wedit.server.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "push_device_tokens",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_push_device_tokens_user_device_token", columnNames = {"user_id", "device_token"})
        }
)
public class PushDeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "device_token", nullable = false, length = 500)
    private String deviceToken;

    @Column(nullable = false, length = 20)
    private String platform;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected PushDeviceToken() {
    }

    private PushDeviceToken(User user, String deviceToken, String platform, String deviceId) {
        this.user = user;
        update(deviceToken, platform, deviceId);
    }

    public static PushDeviceToken create(User user, String deviceToken, String platform, String deviceId) {
        return new PushDeviceToken(user, deviceToken, platform, deviceId);
    }

    public void update(String deviceToken, String platform, String deviceId) {
        this.deviceToken = deviceToken;
        this.platform = platform;
        this.deviceId = deviceId;
        this.active = true;
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getPlatform() {
        return platform;
    }

    public boolean isActive() {
        return active;
    }
}
