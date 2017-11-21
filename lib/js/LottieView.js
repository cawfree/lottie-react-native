import React from 'react';
import {
  findNodeHandle,
  UIManager,
  Animated,
  View,
  Platform,
  StyleSheet,
  ViewPropTypes,
} from 'react-native';
import SafeModule from 'react-native-safe-module';
import PropTypes from 'prop-types';

const NativeLottieView = SafeModule.component({
  viewName: 'LottieAnimationView',
  mockComponent: View,
});

const LottieViewManager = SafeModule.module({
  moduleName: 'LottieAnimationView',
  mock: {
    play: () => {},
    reset: () => {},
  },
});

const ViewStyleExceptBorderPropType = (props, propName, componentName, ...rest) => {
  const flattened = StyleSheet.flatten(props[propName]);
  const usesBorder = Object.keys(flattened).some(key => key.startsWith('border'));
  if (usesBorder) {
    return Error(
      `${componentName} does not allow any border related style properties to be specified. ` +
      'Border styles for this component will behave differently across platforms. If you\'d like ' +
      'to render a border around this component, wrap it with a View.'
    );
  }
  return ViewPropTypes.style(props, propName, componentName, ...rest);
};

const NotAllowedPropType = (props, propName, componentName) => {
  const value = props[propName];
  if (value != null) {
    return Error(`${componentName} cannot specify '${propName}'.`);
  }
  return null;
};

const propTypes = {
  ...ViewPropTypes,
  style: ViewStyleExceptBorderPropType,
  children: NotAllowedPropType,
  resizeMode: PropTypes.oneOf(['cover', 'contain', 'center']),
  progress: PropTypes.number,
  speed: PropTypes.number,
  loop: PropTypes.bool,
  enableMergePathsAndroidForKitKatAndAbove: PropTypes.bool,
  source: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
  ]).isRequired,
};

const defaultProps = {
  progress: 0,
  speed: 1,
  loop: false,
  enableMergePathsAndroidForKitKatAndAbove: false,
  resizeMode: 'contain',
};

const viewConfig = {
  uiViewClassName: 'LottieAnimationView',
  validAttributes: {
    progress: true,
  },
};

class LottieView extends React.Component {
  constructor(props) {
    super(props);
    this.viewConfig = viewConfig;
    this.refRoot = this.refRoot.bind(this);
  }

  setNativeProps(props) {
    UIManager.updateView(this.getHandle(), this.viewConfig.uiViewClassName, {
      progress: props.progress,
    });
  }

  play() {
    this.runCommand('play');
  }

  reset() {
    this.runCommand('reset');
  }

  runCommand(name, args = []) {
    return Platform.select({
      android: () => UIManager.dispatchViewManagerCommand(
        this.getHandle(),
        UIManager.LottieAnimationView.Commands[name],
        args
      ),
      ios: () => LottieViewManager[name](this.getHandle(), ...args),
    })();
  }

  getHandle() {
    return findNodeHandle(this.root);
  }

  refRoot(root) {
    this.root = root;
  }

  render() {
    const { source } = this.props;
    const sourceName = typeof source === 'string' ? source : undefined;
    const sourceJson = typeof source === 'string' ? undefined : JSON.stringify(source);

    return (
      <NativeLottieView
        ref={this.refRoot}
        {...this.props}
        source={undefined}
        sourceName={sourceName}
        sourceJson={sourceJson}
      />
    );
  }
}

LottieView.propTypes = propTypes;
LottieView.defaultProps = defaultProps;

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

AnimatedLottieView.prototype.play = function play() {
  return this.getNode().play();
};

AnimatedLottieView.prototype.reset = function pause() {
  return this.getNode().reset();
};

module.exports = AnimatedLottieView;