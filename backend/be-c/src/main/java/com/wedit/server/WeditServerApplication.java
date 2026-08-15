package com.wedit.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class WeditServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(WeditServerApplication.class, args);
    }
}
