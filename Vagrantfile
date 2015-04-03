ENV['VAGRANT_DEFAULT_PROVIDER'] = 'docker'

SYNCED_FOLDER = "/home/wappalyzer/synced"

Vagrant.configure("2") do |config|
  config.vm.synced_folder ".", SYNCED_FOLDER

  config.vm.provider "docker" do |d|
    d.image           = "wappalyzer/dev"
    d.has_ssh         = true
    d.remains_running = true
  end

  config.ssh.port             = "22"
  config.ssh.username         = "wappalyzer"
  config.ssh.private_key_path = "docker/ssh/insecure.key"

  config.vm.provision "shell", inline: "su - wappalyzer -c 'wappalyzer links'"
  config.vm.provision "shell", inline: "echo Finished. Run \\`vagrant ssh\\` to access the environment."
end
