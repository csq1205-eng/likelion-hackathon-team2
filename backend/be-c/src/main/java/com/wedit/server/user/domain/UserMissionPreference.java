package com.wedit.server.user.domain;

import com.wedit.server.common.StringListJsonConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "user_mission_preferences")
public class UserMissionPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "preferred_mission_types", columnDefinition = "text")
    private List<String> preferredMissionTypes;

    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "avoided_mission_types", columnDefinition = "text")
    private List<String> avoidedMissionTypes;

    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "excluded_keywords", columnDefinition = "text")
    private List<String> excludedKeywords;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected UserMissionPreference() {
    }

    private UserMissionPreference(
            User user,
            List<String> preferredMissionTypes,
            List<String> avoidedMissionTypes,
            List<String> excludedKeywords
    ) {
        this.user = user;
        update(preferredMissionTypes, avoidedMissionTypes, excludedKeywords);
    }

    public static UserMissionPreference create(
            User user,
            List<String> preferredMissionTypes,
            List<String> avoidedMissionTypes,
            List<String> excludedKeywords
    ) {
        return new UserMissionPreference(user, preferredMissionTypes, avoidedMissionTypes, excludedKeywords);
    }

    public void update(
            List<String> preferredMissionTypes,
            List<String> avoidedMissionTypes,
            List<String> excludedKeywords
    ) {
        this.preferredMissionTypes = preferredMissionTypes;
        this.avoidedMissionTypes = avoidedMissionTypes;
        this.excludedKeywords = excludedKeywords;
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

    public List<String> getPreferredMissionTypes() {
        return preferredMissionTypes;
    }

    public List<String> getAvoidedMissionTypes() {
        return avoidedMissionTypes;
    }

    public List<String> getExcludedKeywords() {
        return excludedKeywords;
    }
}
