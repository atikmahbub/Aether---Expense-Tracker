import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  FlatList,
  Modal,
} from 'react-native';
import {useField} from 'formik';
import {TextInput, TouchableRipple} from 'react-native-paper';
import {darkTheme} from '@trackingPortal/themes/darkTheme';
import {colors} from '@trackingPortal/themes/colors';

interface FormikSelectFieldProps {
  name: string;
  label: string;
  options: {label: string; value: string | number}[];
  height: number;
}

const FormikSelectField: React.FC<FormikSelectFieldProps> = ({
  name,
  label,
  options,
  height,
}) => {
  const [field, meta, helpers] = useField(name);
  const [visible, setVisible] = React.useState(false);
  const inputRef = React.useRef<View>(null);
  const [dropdownPosition, setDropdownPosition] = React.useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const openMenu = () => {
    inputRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownPosition({
        top: y + height + 6,
        left: x,
        width,
      });
      setVisible(true);
    });
  };
  const closeMenu = () => setVisible(false);

  const handleSelect = (value: string | number) => {
    helpers.setValue(value);
    closeMenu();
  };

  return (
    <View style={styles.container}>
      <View ref={inputRef} collapsable={false}>
        <TouchableRipple onPress={openMenu}>
          <TextInput
            label={label}
            value={
              options.find(option => option.value === field.value)?.label || ''
            }
            editable={false}
            pointerEvents="none"
            style={styles.input}
            right={<TextInput.Icon icon="chevron-down" />}
            theme={{
              colors: {
                primary: colors.primary,
                text: colors.text,
                placeholder: colors.placeholder,
                background: colors.background,
              },
            }}
          />
        </TouchableRipple>
      </View>
      <Modal
        visible={visible}
        transparent
        onRequestClose={closeMenu}
        animationType="fade">
        <View style={StyleSheet.absoluteFillObject}>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View style={styles.dropdownOverlay} />
          </TouchableWithoutFeedback>
          <View
            style={[
              styles.dropdown,
              {
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxHeight: height,
              },
            ]}>
            <FlatList
              data={options}
              keyExtractor={item => item.value.toString()}
              renderItem={({item}) => (
                <TouchableRipple onPress={() => handleSelect(item.value)}>
                  <Text style={styles.dropdownItem}>{item.label}</Text>
                </TouchableRipple>
              )}
              contentContainerStyle={styles.flatListContent}
              showsVerticalScrollIndicator
            />
          </View>
        </View>
      </Modal>
      {meta.touched && meta.error && (
        <Text style={styles.errorText}>{meta.error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 14,
    overflow: 'hidden',
  },
  input: {
    backgroundColor: darkTheme.colors.surface,
    color: colors.text,
  },
  dropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: darkTheme.colors.surface,
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 10,
    zIndex: 999,
    elevation: 6,
  },
  flatListContent: {
    paddingVertical: 5,
  },
  dropdownItem: {
    padding: 10,
    color: colors.text,
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default FormikSelectField;
