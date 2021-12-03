import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { ValidationTypes } from "constants/WidgetValidation";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { base64ToBlob, createBlobUrl } from "utils/AppsmithUtils";
import { FileDataTypes } from "widgets/constants";

import CameraComponent from "../component";
import { CameraMode, CameraModeTypes } from "../constants";

class CameraWidget extends BaseWidget<CameraWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "mode",
            label: "Mode",
            controlType: "DROP_DOWN",
            helpText: "Whether a picture is taken or a video is recorded",
            options: [
              {
                label: "Camera",
                value: "CAMERA",
              },
              {
                label: "Video",
                value: "VIDEO",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ["CAMERA", "VIDEO"],
              },
            },
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            helpText: "Disables clicks to this widget",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isMirrored",
            label: "Mirrored",
            helpText: "Show camera preview and get the screenshot mirrored",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the image is captured",
            propertyName: "onImageCapture",
            label: "OnImageCapture",
            controlType: "ACTION_SELECTOR",
            hidden: (props: CameraWidgetProps) =>
              props.mode === CameraModeTypes.VIDEO,
            dependencies: ["mode"],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when the video recording get started",
            propertyName: "onRecordingStart",
            label: "OnRecordingStart",
            controlType: "ACTION_SELECTOR",
            hidden: (props: CameraWidgetProps) =>
              props.mode === CameraModeTypes.CAMERA,
            dependencies: ["mode"],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when the video recording stops",
            propertyName: "onRecordingStop",
            label: "onRecordingStop",
            controlType: "ACTION_SELECTOR",
            hidden: (props: CameraWidgetProps) =>
              props.mode === CameraModeTypes.CAMERA,
            dependencies: ["mode"],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      imageBlobURL: undefined,
      imageDataURL: undefined,
      imageRawBinary: undefined,
      videoBlobURL: undefined,
      videoDataURL: undefined,
      videoRawBinary: undefined,
    };
  }

  static getWidgetType(): string {
    return "CAMERA_WIDGET";
  }

  getPageView() {
    const {
      bottomRow,
      isDisabled,
      isMirrored,
      leftColumn,
      mode,
      parentColumnSpace,
      parentRowSpace,
      rightColumn,
      topRow,
    } = this.props;

    const height = (bottomRow - topRow) * parentRowSpace - WIDGET_PADDING * 2;
    const width =
      (rightColumn - leftColumn) * parentColumnSpace - WIDGET_PADDING * 2;

    return (
      <CameraComponent
        disabled={isDisabled}
        height={height}
        mirrored={isMirrored}
        mode={mode}
        onImageCapture={this.handleImageCapture}
        onRecordingStart={this.handleRecordingStart}
        onRecordingStop={this.handleRecordingStop}
        width={width}
      />
    );
  }

  handleImageCapture = (image?: string | null) => {
    if (!image) {
      URL.revokeObjectURL(this.props.imageBlobURL);
      this.props.updateWidgetMetaProperty("imageBlobURL", undefined);
      this.props.updateWidgetMetaProperty("imageDataURL", undefined);
      this.props.updateWidgetMetaProperty("imageRawBinary", undefined);
      return;
    }
    const base64Data = image.split(",")[1];
    const imageBlob = base64ToBlob(base64Data, "image/webp");
    const blobURL = URL.createObjectURL(imageBlob);
    const blobIdForBase64 = createBlobUrl(imageBlob, FileDataTypes.Base64);
    const blobIdForRaw = createBlobUrl(imageBlob, FileDataTypes.Binary);

    this.props.updateWidgetMetaProperty("imageBlobURL", blobURL);

    this.props.updateWidgetMetaProperty("imageDataURL", blobIdForBase64, {
      triggerPropertyName: "onImageCapture",
      dynamicString: this.props.onImageCapture,
      event: {
        type: EventType.ON_CAMERA_IMAGE_CAPTURE,
      },
    });
    this.props.updateWidgetMetaProperty("imageRawBinary", blobIdForRaw, {
      triggerPropertyName: "onImageCapture",
      dynamicString: this.props.onImageCapture,
      event: {
        type: EventType.ON_CAMERA_IMAGE_CAPTURE,
      },
    });
  };

  handleRecordingStart = () => {
    if (this.props.onRecordingStart) {
      super.executeAction({
        triggerPropertyName: "onRecordingStart",
        dynamicString: this.props.onRecordingStart,
        event: {
          type: EventType.ON_CAMERA_VIDEO_RECORDING_START,
        },
      });
    }
  };

  handleRecordingStop = (video?: Blob | null) => {
    if (!video) {
      if (this.props.videoBlobURL) {
        URL.revokeObjectURL(this.props.videoBlobURL);
      }
      this.props.updateWidgetMetaProperty("videoBlobURL", undefined);
      this.props.updateWidgetMetaProperty("videoDataURL", undefined);
      this.props.updateWidgetMetaProperty("videoRawBinary", undefined);
      return;
    }

    const blobURL = URL.createObjectURL(video);
    const blobIdForBase64 = createBlobUrl(video, FileDataTypes.Base64);
    const blobIdForRaw = createBlobUrl(video, FileDataTypes.Binary);

    this.props.updateWidgetMetaProperty("videoBlobURL", blobURL);
    this.props.updateWidgetMetaProperty("videoDataURL", blobIdForBase64, {
      triggerPropertyName: "onRecordingStop",
      dynamicString: this.props.onRecordingStop,
      event: {
        type: EventType.ON_CAMERA_VIDEO_RECORDING_STOP,
      },
    });
    this.props.updateWidgetMetaProperty("videoRawBinary", blobIdForRaw, {
      triggerPropertyName: "onRecordingStop",
      dynamicString: this.props.onRecordingStop,
      event: {
        type: EventType.ON_CAMERA_VIDEO_RECORDING_STOP,
      },
    });
  };
}

export interface CameraWidgetProps extends WidgetProps {
  mode: CameraMode;
  isDisabled: boolean;
  isVisible: boolean;
  isMirrored: boolean;
  onImageCapture?: string;
  onRecordingStart?: string;
  onRecordingStop?: string;
}

export default CameraWidget;
