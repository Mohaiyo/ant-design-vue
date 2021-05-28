import {
  defineComponent,
  ExtractPropTypes,
  ref,
  reactive,
  VNode,
  onUpdated,
  onBeforeUpdate,
  onMounted,
} from 'vue';
import { initDefaultProps, getPropsSlot, findDOMNode } from '../_util/props-util';
import { withInstall } from '../_util/type';
import { getOffsetLeft } from './util';
import classNames from '../_util/classNames';
import PropTypes from '../_util/vue-types';
import KeyCode from '../_util/KeyCode';
import StarFilled from '@ant-design/icons-vue/StarFilled';
import Tooltip from '../tooltip';
import useConfigInject from '../_util/hooks/useConfigInject';

import Star from './Star';
import { useRef } from '../_util/hooks/useRef';

export const rateProps = {
  prefixCls: PropTypes.string,
  count: PropTypes.number,
  value: PropTypes.number,
  allowHalf: PropTypes.looseBool,
  allowClear: PropTypes.looseBool,
  tooltips: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.looseBool,
  character: PropTypes.any,
  autofocus: PropTypes.looseBool,
  tabindex: PropTypes.number,
  direction: PropTypes.string,
};

export type RateProps = Partial<ExtractPropTypes<typeof rateProps>>;

const Rate = defineComponent({
  name: 'ARate',
  props: initDefaultProps(rateProps, {
    value: 0,
    count: 5,
    allowHalf: false,
    allowClear: true,
    prefixCls: 'ant-rate',
    tabindex: 0,
    character: '★',
    direction: 'ltr',
  }),
  emits: ['hoverChange', 'update:value', 'change', 'focus', 'blur', 'keydown'],
  setup(props, { slots, attrs, emit, expose }) {
    const { prefixCls, direction } = useConfigInject('rate', props);
    const rateRef = ref();
    const [setRef, starRefs] = useRef();
    const state = reactive({
      sValue: props.value,
      focused: false,
      cleanedValue: null,
      hoverValue: undefined,
    });

    const getStarDOM = index => {
      return findDOMNode(starRefs[index]);
    };
    const getStarValue = (index, x) => {
      const reverse = direction.value === 'rtl';
      let value = index + 1;
      if (props.allowHalf) {
        const starEle = getStarDOM(index);
        const leftDis = getOffsetLeft(starEle);
        const width = starEle.clientWidth;
        if (reverse && x - leftDis > width / 2) {
          value -= 0.5;
        } else if (!reverse && x - leftDis < width / 2) {
          value -= 0.5;
        }
      }
      return value;
    };
    const changeValue = (value: number) => {
      state.sValue = value;
      emit('update:value', value);
      emit('change', value);
    };

    const onHover = (e: MouseEvent, index) => {
      const hoverValue = getStarValue(index, e.pageX);
      if (hoverValue !== state.cleanedValue) {
        state.hoverValue = hoverValue;
        state.cleanedValue = null;
      }
      emit('hoverChange', hoverValue);
    };
    const onMouseLeave = () => {
      state.hoverValue = undefined;
      state.cleanedValue = null;
      emit('hoverChange', undefined);
    };
    const onClick = (event: MouseEvent, index) => {
      const { allowClear } = props;
      const newValue = getStarValue(index, event.pageX);
      let isReset = false;
      if (allowClear) {
        isReset = newValue === state.sValue;
      }
      onMouseLeave();
      changeValue(isReset ? 0 : newValue);
      state.cleanedValue = isReset ? newValue : null;
    };
    const onFocus = () => {
      state.focused = true;
      emit('focus');
    };
    const onBlur = () => {
      state.focused = false;
      emit('blur');
    };
    const onKeyDown = event => {
      const { keyCode } = event;
      const { count, allowHalf } = props;
      const reverse = direction.value === 'rtl';
      if (keyCode === KeyCode.RIGHT && state.sValue < count && !reverse) {
        if (allowHalf) {
          state.sValue += 0.5;
        } else {
          state.sValue += 1;
        }
        changeValue(state.sValue);
        event.preventDefault();
      } else if (keyCode === KeyCode.LEFT && state.sValue > 0 && !reverse) {
        if (allowHalf) {
          state.sValue -= 0.5;
        } else {
          state.sValue -= 1;
        }
        changeValue(state.sValue);
        event.preventDefault();
      } else if (keyCode === KeyCode.RIGHT && state.sValue > 0 && reverse) {
        if (allowHalf) {
          state.sValue -= 0.5;
        } else {
          state.sValue -= 1;
        }
        changeValue(state.sValue);
        event.preventDefault();
      } else if (keyCode === KeyCode.LEFT && state.sValue < count && reverse) {
        if (allowHalf) {
          state.sValue += 0.5;
        } else {
          state.sValue += 1;
        }
        changeValue(state.sValue);
        event.preventDefault();
      }
      emit('keydown', event);
    };

    const focus = () => {
      if (!props.disabled) {
        rateRef.value.focus();
      }
    };
    const blur = () => {
      if (!props.disabled) {
        rateRef.value.blur();
      }
    };

    expose({
      focus,
      blur,
    });

    onMounted(() => {
      const { autoFocus, disabled } = props;
      if (autoFocus && !disabled) {
        focus();
      }
    });

    const characterRender = (node: VNode, { index }) => {
      const { tooltips } = props;
      if (!tooltips) return node;
      return <Tooltip title={tooltips[index]}>{node}</Tooltip>;
    };
    const character = getPropsSlot(slots, props, 'character') || <StarFilled />;

    return () => {
      const { count, allowHalf, disabled, tabindex } = props;
      const { class: className, style } = attrs;
      const stars = [];
      const disabledClass = disabled ? `${prefixCls.value}-disabled` : '';
      for (let index = 0; index < count; index++) {
        stars.push(
          <Star
            ref={setRef}
            key={index}
            index={index}
            count={count}
            disabled={disabled}
            prefixCls={`${prefixCls.value}-star`}
            allowHalf={allowHalf}
            value={state.hoverValue === undefined ? state.sValue : state.hoverValue}
            onClick={onClick}
            onHover={onHover}
            character={character}
            characterRender={characterRender}
            focused={state.focused}
          />,
        );
      }
      const rateClassName = classNames(prefixCls.value, disabledClass, className, {
        [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
      });
      return (
        <ul
          {...attrs}
          class={rateClassName}
          style={style}
          onMouseleave={disabled ? null : onMouseLeave}
          tabindex={disabled ? -1 : tabindex}
          onFocus={disabled ? null : onFocus}
          onBlur={disabled ? null : onBlur}
          onKeydown={disabled ? null : onKeyDown}
          ref={rateRef}
          role="radiogroup"
        >
          {stars}
        </ul>
      );
    };
  },
});

export default withInstall(Rate);
