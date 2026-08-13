package com.wedit.server.user.repository;

import com.wedit.server.user.domain.User;
import com.wedit.server.user.domain.UserOwnedProduct;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserOwnedProductRepository extends JpaRepository<UserOwnedProduct, Long> {

    List<UserOwnedProduct> findAllByUser(User user);

    void deleteByUser(User user);
}
