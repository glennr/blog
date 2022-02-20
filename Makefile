.PHONY: dcup

#
# Common Docker setup and daily usage dev tools
#
dcup:
	@echo
	@echo "Launching local development environment with docker-compose."
	@echo
	@echo "Stays in foreground. ^C to stop containers. ^C twice to kill containers"
	@echo
	docker-compose up
