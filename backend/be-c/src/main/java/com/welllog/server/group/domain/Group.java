package com.welllog.server.group.domain;

import com.welllog.server.user.domain.User;
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "groups")
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "goal_name", nullable = false, length = 100)
    private String goalName;

    @Column(name = "target_days", nullable = false)
    private int targetDays;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GroupStatus status;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Group() {
    }

    private Group(User owner, String name, String goalName, int targetDays) {
        this.owner = owner;
        this.name = name;
        this.goalName = goalName;
        this.targetDays = targetDays;
        this.status = GroupStatus.ACTIVE;
    }

    public static Group create(User owner, String name, String goalName, int targetDays) {
        return new Group(owner, name, goalName, targetDays);
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

    public User getOwner() {
        return owner;
    }

    public String getName() {
        return name;
    }

    public String getGoalName() {
        return goalName;
    }

    public int getTargetDays() {
        return targetDays;
    }

    public GroupStatus getStatus() {
        return status;
    }
}
