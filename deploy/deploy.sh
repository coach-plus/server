pip install portainer-cli
portainer-cli configure https://portainer.coach.plus/
portainer-cli login $(PORTAINER_USER) $(PORTAINER_PASSWORD)
cat "_coach-plus.server/deployment/$(STACK_FILE)" | sed "s/{{version}}/$(Build.BuildNumber)/g" > stack.yml
portainer-cli update_stack $(STACK_ID) 1 stack.yml