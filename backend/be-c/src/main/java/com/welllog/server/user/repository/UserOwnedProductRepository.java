package com.welllog.server.user.repository;

import com.welllog.server.user.domain.User;
import com.welllog.server.user.domain.UserOwnedProduct;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserOwnedProductRepository extends JpaRepository<UserOwnedProduct, Long> {

    List<UserOwnedProduct> findAllByUser(User user);

    void deleteByUser(User user);
}
