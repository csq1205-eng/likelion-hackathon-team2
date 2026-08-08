package com.welllog.server.group.repository;

import com.welllog.server.group.domain.Group;
import com.welllog.server.group.domain.GroupInvite;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupInviteRepository extends JpaRepository<GroupInvite, Long> {

    boolean existsByInviteCode(String inviteCode);

    Optional<GroupInvite> findByGroup(Group group);

    Optional<GroupInvite> findByInviteCode(String inviteCode);
}
