import 'package:freezed_annotation/freezed_annotation.dart';

part 'ambient.freezed.dart';
part 'ambient.g.dart';

@freezed
class Ambient with _$Ambient {
  const factory Ambient({
    required String id,
    required String name,
    required int color,
    required String currencyCode,
    required int createdAt,
    required int updatedAt,
  }) = _Ambient;

  factory Ambient.fromJson(Map<String, dynamic> json) => _$AmbientFromJson(json);
}
