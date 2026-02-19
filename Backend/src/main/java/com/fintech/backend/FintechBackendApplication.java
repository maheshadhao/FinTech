package com.fintech.backend;

import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableScheduling
public class FintechBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(FintechBackendApplication.class, args);
	}

}
