FROM phusion/baseimage

MAINTAINER Elbert Alias <elbert@alias.io>

ENV DEBIAN_FRONTEND noninteractive

ENV WAPPALYZER_ROOT /home/wappalyzer/synced
ENV WAPPALYZER_NODE_PATH /home/wappalyzer/node

# Install packages
RUN sed -i 's/archive\.ubuntu\.com/au.archive.ubuntu.com/g' /etc/apt/sources.list
RUN apt-get update && apt-get install -y sudo curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y nodejs bzip2 zip libfreetype6 libfontconfig rsync
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*


# Add user
RUN useradd -ms /bin/bash wappalyzer && usermod -a -G docker_env wappalyzer && echo "wappalyzer:wappalyzer" | chpasswd
RUN echo 'wappalyzer ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

WORKDIR /home/wappalyzer

RUN su wappalyzer -c "mkdir bin synced"
RUN su wappalyzer -c "echo \"export PATH=\$PATH:/home/wappalyzer/bin:\\$WAPPALYZER_ROOT/bin\" | cat - .profile > /tmp/profile && mv /tmp/profile .profile"

RUN echo "cd \$WAPPALYZER_ROOT" >> .bashrc
RUN echo "wappalyzer" >> .bashrc


# PhantomJS
# RUN su wappalyzer -c "\
# 	mkdir phantomjs && \
# 	curl -L https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2 | tar xvjC phantomjs && \
# 	ln -s /home/wappalyzer/phantomjs/phantomjs-*-linux-x86_64/bin/phantomjs /usr/bin/phantomjs"


# Node JS
RUN su wappalyzer -c "mkdir $WAPPALYZER_NODE_PATH"

ADD node/package.json $WAPPALYZER_NODE_PATH/package.json

RUN su wappalyzer -c "cd $WAPPALYZER_NODE_PATH && npm i"


# SSH
RUN rm -f /etc/service/sshd/down
RUN su wappalyzer -c "mkdir .ssh && chmod 700 .ssh"

ADD ssh/insecure.key.pub /tmp/insecure.key.pub

RUN su wappalyzer -c "cat /tmp/insecure.key.pub >> .ssh/authorized_keys && chmod 600 .ssh/authorized_keys" && rm -f /tmp/insecure.key.pub


# Fix the `stdin: is not a tty` error in Vagrant
RUN sed -i 's/^mesg n$/tty -s \&\& mesg n/g' /root/.profile

EXPOSE 22

RUN echo "/usr/sbin/sshd -D" > /etc/my_init.d/sshd.sh

CMD ["/sbin/my_init"]
