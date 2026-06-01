#!/bin/bash
# apt wrapper for Alpine to simulate Debian/Kali environment
cmd=$1
shift

if [ -z "$cmd" ]; then
  echo "apt 1.0 (mock wrapper for Alpine)"
  exit 0
fi

case "$cmd" in
  update)
    echo "Hit:1 https://http.kali.org/kali kali-rolling InRelease"
    echo "Reading package lists... Done"
    apk update >/dev/null
    ;;
  install)
    # Filter flags
    pkgs=""
    for arg in "$@"; do
      case "$arg" in
        -y|--yes|-f|--fix-broken)
          ;;
        *)
          pkgs="$pkgs $arg"
          ;;
      esac
    done
    
    echo "Reading package lists... Done"
    echo "Building dependency tree... Done"
    echo "The following NEW packages will be installed:"
    echo "  $pkgs"
    echo "0 upgraded, $(echo $pkgs | wc -w) newly installed, 0 to remove."
    
    # Run apk add
    apk add --no-cache $pkgs
    ;;
  remove|purge|autoremove)
    apk del "$@"
    ;;
  search)
    apk search "$@"
    ;;
  upgrade)
    apk upgrade
    ;;
  *)
    apk "$cmd" "$@"
    ;;
esac
