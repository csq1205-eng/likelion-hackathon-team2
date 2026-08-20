package com.wedit.server.group.repository;

import com.wedit.server.group.domain.Group;
import com.wedit.server.group.domain.GroupMember;
import com.wedit.server.group.domain.GroupMemberStatus;
import com.wedit.server.user.domain.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    List<GroupMember> findAllByUserAndStatus(User user, GroupMemberStatus status);

    List<GroupMember> findAllByUserAndStatusOrderByIdAsc(User user, GroupMemberStatus status);

    List<GroupMember> findAllByGroupAndStatus(Group group, GroupMemberStatus status);

    Optional<GroupMember> findByGroupAndUser(Group group, User user);

    boolean existsByGroupAndUserAndStatus(Group group, User user, GroupMemberStatus status);

    long countByGroupAndStatus(Group group, GroupMemberStatus status);
}
