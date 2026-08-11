package com.wedit.server.reward.domain;

import com.wedit.server.group.domain.Group;
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
import java.time.LocalDateTime;

@Entity
@Table(name = "reward_grants")
public class RewardGrant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reward_id", nullable = false)
    private Reward reward;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RewardGrantStatus status;

    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    protected RewardGrant() {
    }

    private RewardGrant(User user, Reward reward, Group group) {
        this.user = user;
        this.reward = reward;
        this.group = group;
        this.status = RewardGrantStatus.GRANTED;
    }

    public static RewardGrant create(User user, Reward reward, Group group) {
        return new RewardGrant(user, reward, group);
    }

    @PrePersist
    public void prePersist() {
        this.grantedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Reward getReward() {
        return reward;
    }

    public Group getGroup() {
        return group;
    }

    public RewardGrantStatus getStatus() {
        return status;
    }

    public LocalDateTime getGrantedAt() {
        return grantedAt;
    }
}
