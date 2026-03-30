import React, {useRef, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Collapsible from 'react-native-collapsible';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors} from '@trackingPortal/themes/colors';
import {Image} from 'react-native';
import {formatNumber} from '@trackingPortal/utils/utils';

const tintHex = (hex?: string, alpha = 0.15) => {
  if (!hex) {
    return `rgba(255,255,255,${alpha})`;
  }
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface DataTableProps {
  headers: string[];
  data: Array<{[key: string]: any}>;
  onDelete: (id: any) => void;
  isAnyRowOpen: (value: boolean) => void;
  expandedRowId: any;
  setExpandedRowId: React.Dispatch<React.SetStateAction<any>>;
  renderCollapsibleContent: (item: any) => React.ReactNode;
  renderSwipeActions?: (id: any, close: () => void) => React.ReactNode;
}

const Row = React.memo(
  ({
    item,
    isRowOpen,
    swipeableRef,
    onDelete,
    onEditToggle,
    renderSwipeActions,
    defaultSwipeActions,
    renderCollapsibleContent,
  }: {
    item: any;
    isRowOpen: boolean;
    swipeableRef: (ref: any) => void;
    onDelete: (id: any) => void;
    onEditToggle: (id: any) => void;
    renderSwipeActions?: (id: any, close: () => void) => React.ReactNode;
    defaultSwipeActions: (id: any, close: () => void) => React.ReactNode;
    renderCollapsibleContent: (item: any) => React.ReactNode;
  }) => {
    const isLoanRow = item.Type === "Given" || item.Type === "Taken";

    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={
          !isRowOpen
            ? () =>
                renderSwipeActions
                  ? renderSwipeActions(item.id, () => {})
                  : defaultSwipeActions(item.id, () => {})
            : undefined
        }
        enabled={!isRowOpen}
      >
        <View style={styles.rowWrapper}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onEditToggle(item.id)}
            style={[styles.row, isRowOpen && styles.rowActive]}
          >
            {item.Avatar ? (
              <View style={styles.avatarContainer}>
                <Image source={{ uri: item.Avatar }} style={styles.avatarImage} />
                <View
                  style={[
                    styles.avatarBadge,
                    item.Type === "Given"
                      ? styles.badgeGiven
                      : styles.badgeTaken,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.Type === "Given" ? "arrow-up" : "arrow-down"}
                    size={10}
                    color={colors.background}
                  />
                </View>
              </View>
            ) : item.IconName ? (
              <View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor: item.IconBackground,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.IconName}
                  size={22}
                  color={item.IconColor || colors.primary}
                />
              </View>
            ) : (
              <View style={styles.iconWrapper}>
                <Icon name="receipt" size={24} color={colors.primary} />
              </View>
            )}
            <View style={styles.textContainer}>
              <Text style={styles.purposeText}>{item.Purpose}</Text>
              {item.CategoryName ? (
                <View style={styles.categoryLineRow}>
                  <Text
                    style={[
                      styles.categoryLine,
                      { color: item.CategoryColor || colors.subText },
                    ]}
                  >
                    {item.CategoryName}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.dateText}>{item.DateDisplay}</Text>
            </View>
            <View style={styles.amountContainer}>
              <Text
                style={[
                  styles.amountText,
                  item.Type === "Taken" && { color: colors.error },
                ]}
              >
                {item.AmountDisplay}
              </Text>
              <View
                style={[
                  styles.typeBadge,
                  isLoanRow
                    ? item.Type === "Given"
                      ? styles.typeBadgeGiven
                      : styles.typeBadgeTaken
                    : item.CategoryColor
                    ? { backgroundColor: tintHex(item.CategoryColor, 0.12) }
                    : undefined,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isLoanRow && item.Type === "Given" && { color: "#b6f700" },
                    isLoanRow && item.Type === "Taken" && { color: "#ff8e8b" },
                    !isLoanRow &&
                      item.CategoryColor && { color: item.CategoryColor },
                  ]}
                >
                  {isLoanRow
                    ? item.Type === "Given"
                      ? "LENT"
                      : "BORROWED"
                    : item.CategoryName
                    ? item.CategoryName.toUpperCase()
                    : "EXPENSE"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          {isRowOpen && (
            <View style={styles.collapsibleContent}>
              {renderCollapsibleContent(item)}
            </View>
          )}
        </View>
      </Swipeable>
    );
  },
);

const DataTable: React.FC<DataTableProps> = ({
  headers,
  data,
  onDelete,
  isAnyRowOpen,
  expandedRowId,
  setExpandedRowId,
  renderCollapsibleContent,
  renderSwipeActions,
}) => {
  const swipeableRefs = useRef<Record<string, any>>({});

  const formattedData = useMemo(() => {
    return data.map((item: any) => {
      const amountValue =
        item.DisplayAmount ?? item["Amount"] ?? item[headers[2]] ?? "--";
      const amountText =
        typeof amountValue === "number"
          ? formatNumber(item.Type === "Taken" ? amountValue * -1 : amountValue, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : String(amountValue);

      return {
        ...item,
        id: item.id,
        Purpose:
          item["Purpose"] || item["Name"] || item[headers[1]] || "Transaction",
        DateDisplay: item["Date"] || item["Deadline"] || item[headers[0]],
        AmountDisplay: amountText,
      };
    });
  }, [data, headers]);

  const handleEditToggle = useCallback(
    (id: number) => {
      // Close others
      Object.keys(swipeableRefs.current).forEach((key) => {
        if (key !== id.toString()) {
          swipeableRefs.current[key]?.close();
        }
      });

      setExpandedRowId(expandedRowId === id ? null : id);
    },
    [expandedRowId, setExpandedRowId],
  );

  const handleDelete = useCallback(
    (id: number) => {
      swipeableRefs.current[id]?.close();
      Alert.alert("Delete Row", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => onDelete(id) },
      ]);
    },
    [onDelete],
  );

  const defaultSwipeActions = useCallback(
    (id: number, close: () => void) => (
      <View style={styles.swipeActions}>
        <View style={styles.swipeActionsBackdrop} />
        <View style={styles.swipeActionsContent}>
          <TouchableOpacity
            style={[styles.swipeActionButton, styles.deleteAction]}
            activeOpacity={0.9}
            onPress={() => {
              close();
              handleDelete(id);
            }}
          >
            <View style={[styles.actionIconBadge, styles.deleteBadge]}>
              <Icon name="delete" size={20} color={colors.text} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleDelete],
  );

  useEffect(() => {
    isAnyRowOpen(expandedRowId !== null);
  }, [isAnyRowOpen, expandedRowId]);

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No data available</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.table}>
        {formattedData.length > 0 ? (
          formattedData.map((item, index) => (
            <Row
              key={item.id?.toString() || index}
              item={item}
              isRowOpen={expandedRowId === item.id}
              swipeableRef={(ref) => {
                swipeableRefs.current[item.id] = ref;
              }}
              onDelete={handleDelete}
              onEditToggle={handleEditToggle}
              renderSwipeActions={renderSwipeActions}
              defaultSwipeActions={defaultSwipeActions}
              renderCollapsibleContent={renderCollapsibleContent}
            />
          ))
        ) : (
          renderEmptyComponent()
        )}
      </View>
    </View>
  );
};

export default DataTable;

const styles = StyleSheet.create({
  mainContainer: {
    width: '100%',
    marginTop: 16,
  },
  header: {
    display: 'none',
  },
  headerCell: {
    display: 'none',
  },
  table: {
    width: '100%',
    paddingVertical: 10,
  },
  rowWrapper: {
    width: '100%',
    marginBottom: 14,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
    alignItems: 'center',
  },
  rowActive: {
    backgroundColor: colors.surface,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  purposeText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  categoryLine: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  categoryLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryInlineIcon: {
    marginTop: 1,
  },
  dateText: {
    color: colors.subText,
    fontSize: 13,
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Manrope',
    letterSpacing: 0.2,
  },
  typeBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeGiven: {
    backgroundColor: 'rgba(182, 247, 0, 0.1)',
  },
  typeBadgeTaken: {
    backgroundColor: 'rgba(255, 142, 139, 0.1)',
  },
  categoryText: {
    color: colors.subText,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    position: 'relative',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceAlt,
  },
  badgeGiven: {
    backgroundColor: '#a1faff',
  },
  badgeTaken: {
    backgroundColor: '#ff8e8b',
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    height: '100%',
    paddingHorizontal: 12,
  },
  swipeActionsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  swipeActionsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: '100%',
  },
  swipeActionButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    shadowColor: colors.overlay,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 10},
    elevation: Platform.OS === 'android' ? 2 : 6,
  },
  editAction: {
    backgroundColor: colors.badgePositiveBg,
  },
  deleteAction: {
    backgroundColor: colors.badgeNegativeBg,
  },
  actionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    backgroundColor: colors.accent,
  },
  deleteBadge: {
    backgroundColor: colors.error,
  },
  collapsibleContent: {
    backgroundColor: colors.overlay,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    width: '100%',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surfaceAlt,
  },
  emptyText: {
    color: colors.subText,
    fontSize: 16,
    textAlign: 'center',
  },
});
