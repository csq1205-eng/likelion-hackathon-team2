package com.wedit.server.group.domain;

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
        name = "group_members",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_group_members_group_user",
                        columnNames = {"group_id", "user_id"}
                )
        }
)
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GroupMemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GroupMemberStatus status;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    protected GroupMember() {
    }

    private GroupMember(Group group, User user, GroupMemberRole role) {
        this.group = group;
        this.user = user;
        this.role = role;
        this.status = GroupMemberStatus.ACTIVE;
    }

    public static GroupMember createOwner(Group group, User user) {
        return new GroupMember(group, user, GroupMemberRole.OWNER);
    }

    public static GroupMember createMember(Group group, User user) {
        return new GroupMember(group, user, GroupMemberRole.MEMBER);
    }

    @PrePersist
    public void prePersist() {
        this.joinedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Group getGroup() {
        return group;
    }

    public User getUser() {
        return user;
    }

    public GroupMemberRole getRole() {
        return role;
    }

    public GroupMemberStatus getStatus() {
        return status;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }
}
