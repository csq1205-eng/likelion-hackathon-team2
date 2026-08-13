package com.wedit.server.mission.domain;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "missions")
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @Column(name = "mission_date", nullable = false)
    private LocalDate missionDate;

    @Column(length = 20)
    private String slot;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(name = "mission_type", nullable = false, length = 50)
    private String missionType;

    @Column(name = "verification_criteria", length = 1000)
    private String verificationCriteria;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MissionStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Mission() {
    }

    private Mission(
            User user,
            Group group,
            LocalDate missionDate,
            String slot,
            String title,
            String description,
            String missionType,
            String verificationCriteria
    ) {
        this.user = user;
        this.group = group;
        this.missionDate = missionDate;
        this.slot = slot;
        this.title = title;
        this.description = description;
        this.missionType = missionType;
        this.verificationCriteria = verificationCriteria;
        this.status = MissionStatus.PENDING;
    }

    public static Mission create(
            User user,
            Group group,
            LocalDate missionDate,
            String slot,
            String title,
            String description,
            String missionType
    ) {
        return new Mission(user, group, missionDate, slot, title, description, missionType, null);
    }

    public static Mission create(
            User user,
            Group group,
            LocalDate missionDate,
            String slot,
            String title,
            String description,
            String missionType,
            String verificationCriteria
    ) {
        return new Mission(user, group, missionDate, slot, title, description, missionType, verificationCriteria);
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

    public Group getGroup() {
        return group;
    }

    public LocalDate getMissionDate() {
        return missionDate;
    }

    public String getSlot() {
        return slot;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getMissionType() {
        return missionType;
    }

    public String getVerificationCriteria() {
        return verificationCriteria;
    }

    public MissionStatus getStatus() {
        return status;
    }
}
