#!/usr/bin/env python3
"""Deploy the Bileton static site to the PS.kz VPS.

Uses SSH key auth (no password needed once the key is on the server, see
`deploy/README.md`). Uploads index.html and assets/img/* via SFTP, then
reloads nginx. Works on Windows without rsync.

Usage:
    python deploy/deploy.py
    python deploy/deploy.py --host 82.115.43.253 --user ubuntu --path /var/www/bileton
"""
import argparse
import os
import sys

try:
    import paramiko
except ImportError:
    print("Missing dependency. Run: pip install paramiko")
    sys.exit(1)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="82.115.43.253")
    parser.add_argument("--user", default="ubuntu")
    parser.add_argument("--path", default="/var/www/bileton")
    parser.add_argument("--reload-nginx", action="store_true", default=True)
    args = parser.parse_args()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(args.host, username=args.user, timeout=15)  # uses ssh-agent / default key
    sftp = client.open_sftp()

    def ensure_remote_dir(path):
        parts = path.strip("/").split("/")
        cur = ""
        for p in parts:
            cur += "/" + p
            try:
                sftp.stat(cur)
            except FileNotFoundError:
                sftp.mkdir(cur)

    # index.html
    sftp.put(os.path.join(PROJECT_ROOT, "index.html"), f"{args.path}/index.html")
    print("uploaded index.html")

    # assets/img/*
    local_img_dir = os.path.join(PROJECT_ROOT, "assets", "img")
    ensure_remote_dir(f"{args.path}/assets/img")
    count = 0
    for fname in os.listdir(local_img_dir):
        local_path = os.path.join(local_img_dir, fname)
        if os.path.isfile(local_path):
            sftp.put(local_path, f"{args.path}/assets/img/{fname}")
            count += 1
    print(f"uploaded {count} files to assets/img/")

    sftp.close()

    if args.reload_nginx:
        stdin, stdout, stderr = client.exec_command("sudo -n nginx -t && sudo -n systemctl reload nginx")
        code = stdout.channel.recv_exit_status()
        if code == 0:
            print("nginx reloaded")
        else:
            print("nginx reload skipped (needs sudo password); files are already updated on disk")

    client.close()
    print(f"Done. Check: https://bileton.kz/")


if __name__ == "__main__":
    main()
