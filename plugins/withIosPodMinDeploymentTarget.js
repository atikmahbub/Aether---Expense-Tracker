const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const MARKER = '# min-ios-deployment-target';

const BLOCK = `
    ${MARKER}
    # Xcode 26 refuses to build targets whose deployment target is below iOS 15.1.
    # Some pods (lottie-ios, SDWebImage, RNSVG, ReachabilitySwift, ...) ship older values.
    min_ios = podfile_properties['ios.deploymentTarget'] || '15.1'
    installer.pods_project.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = min_ios
    end
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        current = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || Gem::Version.new(current.to_s) < Gem::Version.new(min_ios)
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = min_ios
        end
      end
    end
`;

module.exports = function withIosPodMinDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfilePath, 'utf8');
      if (contents.includes(MARKER)) {
        return config;
      }
      const anchor = '      :ccache_enabled => ccache_enabled?(podfile_properties),\n    )\n';
      if (!contents.includes(anchor)) {
        throw new Error('withIosPodMinDeploymentTarget: could not find react_native_post_install call in Podfile');
      }
      fs.writeFileSync(podfilePath, contents.replace(anchor, anchor + BLOCK));
      return config;
    },
  ]);
};
