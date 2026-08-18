package com.wedit.server.product.repository;

import com.wedit.server.product.domain.ProductRecommendation;
import com.wedit.server.product.domain.ProductRecommendationType;
import com.wedit.server.user.domain.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRecommendationRepository extends JpaRepository<ProductRecommendation, Long> {

    List<ProductRecommendation> findAllByUserOrderByCreatedAtDesc(User user);

    List<ProductRecommendation> findAllByUserAndRecommendationTypeOrderByCreatedAtDesc(
            User user,
            ProductRecommendationType recommendationType
    );
}
