FROM ubuntu:latest
LABEL authors="galosk"

ENTRYPOINT ["top", "-b"]